import * as binding from "./bindz.mjs" ;
import { loadScript, waiter } from "./utilz.mjs";

async function polyfillCssScope(){
    if(typeof CSSScopeRule != 'undefined') {
        return "@scope"
    }
    //@scope is not supported by this browser (should not happens anymore in late 2024 / early 2025)
    //load polyfill https://github.com/samthor/scoped
    await loadScript("https://unpkg.com/style-scoped/scoped.min.js");
    return "scoped" ;
}

let VIEWS = {};
let viewInc = 0;
export class ViewZ {
    constructor({route, html, js, css, id, loader}){
        this.viewId = id??new Date().getTime()+"-"+viewInc++ ;
        this.instanceId = new Date().getTime()+"-"+viewInc++ ;

        this.options = {html, js, css, route, id} ;

        this.docTransformers = [];

        this.loader = loader||`<style>
        /* Styling the loader */
        .viewz-loader {
            border: 8px solid #dcdcdc; /* Light gray border */
            border-top: 8px solid #333; /* Dark gray top border */
            border-radius: 50%; /* Makes it a circle */
            width: 50px; /* Width of the spinner */
            height: 50px; /* Height of the spinner */
            animation: spin 1s linear infinite; /* Spin animation */
        }

        /* Keyframes for the spin animation */
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    </style><div class="viewz-loader"></div>`
    }

    /**
     * Add a transformer callback to modify the HTML DOM
     * @param {*} transformer 
     */
    docTransformer(transformer){
        if(VIEWS[this.viewId]){
            console.warn("You are trying to add a transformer but the view has already been prepared") ;
        }
        this.docTransformers.push(transformer);
    }

    sourcesPrepared(){
        if(!VIEWS[this.viewId]){ return false; }
        if(VIEWS[this.viewId] === "preparing"){ return false; }
        return true;
    }

    async prepareSources(){
        if(VIEWS[this.viewId]){ 
            if(VIEWS[this.viewId] === "preparing"){
                //currently preparing, wait a little
                return new Promise((resolve, reject)=>{
                    setTimeout(()=>{
                        this.prepareSources().then(resolve).catch(reject);
                    }, 10);
                })
            }
            return; 
        }
        VIEWS[this.viewId] = "preparing" ;
        let response = await fetch(this.options.html);
        let sources = {
            html: "",
            js: "",
            css: "",
        }
        sources.html = await response.text();
        
        if(this.options.js){
            let response = await fetch(this.options.js);
            let js = await response.text();
            sources.js = js;
        }

        if(this.options.css){
            let response = await fetch(this.options.css);
            let css = await response.text();
            sources.css = css;
        }

        let template = document.createElement("template") ;
        let css = "";
        if(sources.css){
            /*let scopeMode = await polyfillCssScope();
            if(scopeMode === "@scope"){
                css = `<style>@scope {${sources.css}}</style>`
            }else{
                //using polyfill
                css = `<style scoped>${sources.css}</style>`
            }*/
           css = `<style>${sources.css}</style>`
        }
        template.innerHTML = `${css}${sources.html}` ;
        
        document.body.appendChild(template) ;

       /* customElements.define('view-'+this.viewId,
            class extends HTMLElement {
                constructor() {
                    super();

                    let templateContent = template.content;

                    let body = this.attachShadow({mode: 'open'}) ;

                    const clone = document.importNode(templateContent, true);
                    const bodyEl = document.createElement("body") ;
                    bodyEl.appendChild(clone) ;

                    
                    this.shadowRoot.createElement = function(){
                        return document.createElement.apply(document, arguments) ;
                    } ;
                    
                    
                    if(sources.css){
                        let styleEl = document.createElement("STYLE");
                        styleEl.innerHTML = sources.css;
                        body.appendChild(styleEl) ;
                    }

                    //bodyEl.style.display = "none" ;
                    body.appendChild(bodyEl);
                }
        }) ;*/

        VIEWS[this.viewId]= {sources, template};
    }

    async bind(forceRefresh = false){
        const newGlobals = {
            params : this.route?(this.route.params||{}):{}, 
            pathname: this.route?this.route.pathname:"",
            actions: this.actions} ;
        this.body._globals = newGlobals ;
        //window.tr(this.body) ;
        let data = this.data ;
        if(this.body && this.body.__zzBindData){
            data = this.body.__zzBindData ;
            if(!data._globals){
                data._globals = newGlobals ;
            }else{
                Object.keys(newGlobals).forEach((k)=>{
                    data._globals[k] = newGlobals[k] ;
                }) ;
            }
        }else{
            if(data._globals){
                data._globals = newGlobals ;
            }
        }

        if(!data._globals){
            data._globals = newGlobals ;
        }
        await binding.bind(this.body, data, null, null, forceRefresh) ;
    }

    async render({container, route, ssr}){
        if(!ssr && !this.sourcesPrepared()){
            container.innerHTML = this.loader;
        }
        //polyfill immediatly
        let scopeMode = await polyfillCssScope();

        this.route = route ;

        if(!ssr){
            //in SSR, prepare the source at the end to avoid to wait for something we already have
            await this.prepareSources();
        }
        
        this.data = {};

        if(this.container === container && this.container.getAttribute("z-view") === this.options.page){
            //already active, refresh
            // waiter(this.bind()).then(()=>{
            //     this.body.dispatchEvent(new CustomEvent("refresh"));
            // }) ;
            // return;
            return waiter(this.bind()).then(()=>{
                this.body.dispatchEvent(new CustomEvent("refresh"));
            }) ;
        }
        this.container = container ;
        //this.container.setAttribute("z-view", this.options.page) ;
        if(this.container.hasAttribute("z-view-instance-id")){
            //the container previously contain another view instance, delete it to clean memory
            delete window[this.container.getAttribute("z-view-instance-id")]
        }
        this.container.setAttribute("z-view-instance-id", this.instanceId) ;

        if(!ssr){
            this.container.innerHTML = "";
            let templateCopy = document.importNode(VIEWS[this.viewId].template.content, true);
            while(templateCopy.children.length>0){
                if(templateCopy.children[0].tagName === "STYLE"){
                    if(scopeMode === "@scope"){
                        templateCopy.children[0].innerHTML = `@scope {${templateCopy.children[0].innerHTML}}`;
                    }else{
                        //using polyfill
                        templateCopy.children[0].setAttribute("scoped", "scoped");
                    }
                }
                this.container.appendChild(templateCopy.children[0]);
            }
        }else{
            // SSR does not know if the @scope CSS is supported or not, we must add it
            let style = this.container.querySelector("style");
            if(style){
                if(scopeMode === "@scope"){
                    style.innerHTML = `@scope {${style.innerHTML}}`;
                }else{
                    //using polyfill
                    style.setAttribute("scoped", "scoped");
                }
            }
        }

        for(let transformer of this.docTransformers){
            transformer(this.container) ;
        }


        //this.container.innerHTML = "<view-"+this.viewId+" id=\""+this.instanceId+"\" class=\"view-controller-container\"></view-"+this.viewId+">" ;
       /* this.body = this.container.querySelector("view-"+this.viewId) ;
        this.shadowRoot = this.body.shadowRoot;
        window[this.instanceId] = this.shadowRoot ;
        this.shadowRoot._viewController = this ;*/

        window[this.instanceId] = this ;

        //waiter(this.bind());

        if(ssr){
            //in SSR, prepare the source at the end without waiting just to have it ready for next time
            await this.prepareSources();
        }

        if(VIEWS[this.viewId].sources.js){
            let scriptEl = document.createElement("SCRIPT");
            scriptEl.type = "module" ;
            scriptEl.innerHTML = `(function(view){
${VIEWS[this.viewId].sources.js}
})(window["${this.instanceId}"]) ;

//# sourceURL=${this.options.js}`;
            this.container.appendChild(scriptEl) ;
        }

        

        // .then(()=>{
        //     bodyEl.style.display = "" ;

            
            
        // }), self.container).finally(()=>{
            
        // }) ;
    }
}