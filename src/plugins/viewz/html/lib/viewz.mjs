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

const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;

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
        this.docTransformers.push(transformer);
    }

    sourcesPrepared(){
        if(!VIEWS[this.viewId]){ return false; }
        if(VIEWS[this.viewId] === "preparing"){ return false; }
        return true;
    }

    async prepareSources({ ssr }){
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

        let sources = {
            html: "",
            js: "",
            css: "",
        }

        if(this.options.js){
            let response = await fetch(this.options.js);
            let js = await response.text();
            sources.js = js;
            let scriptBody = `${sources.js}
//# sourceURL=${this.options.js}` ;

            sources.jsFunction = new AsyncFunction("view", scriptBody);
        }

        VIEWS[this.viewId]= {sources};

        let loadHtmlCss = async ()=>{
            let response = await fetch(this.options.html);
            
            sources.html = await response.text();
            
            if(this.options.css){
                let response = await fetch(this.options.css);
                let css = await response.text();
                sources.css = css;
            }
    
            let template = document.createElement("template") ;
            let css = "";
            if(sources.css){
               css = `<style>${sources.css}</style>`
            }
            template.innerHTML = `${css}${sources.html}` ;
            
            document.body.appendChild(template) ;
            VIEWS[this.viewId]= {sources, template};
        }

        if(ssr){
            //HTML already loaded, don't wait for its refetch
            loadHtmlCss();
        }else{
            //not in SSR mode, wait for all loaded
            await loadHtmlCss();
        }
    }

    async bind(forceRefresh = false){
        const newGlobals = {
            params : this.route?(this.route.params||{}):{}, 
            pathname: this.route?this.route.pathname:"",
            actions: this.actions} ;
        this.container._globals = newGlobals ;
        //window.tr(this.body) ;
        let data = this.data ;
        if(this.container && this.container.zzBindData){
            data = this.container.zzBindData ;
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
        await binding.bind(this.container, data, null, null, forceRefresh) ;
    }

    async render({container, route, ssr}){
        //polyfill immediatly
        let scopeMode = await polyfillCssScope();


        this.container = container ;
        this.route = route ;

        //TODO: improve this cleaning
        delete this.container.zzBindData ;
        delete this.container.__zzBindPrepared ;
        this.container.removeAttribute("zz-bind-prepared");

        if(this.container.zzView){
            //remove all listener of previous view rendered in this container
            this.container.zzView.eventController.abort()
        }
        //set this view as current view of this controller
        this.container.zzView = this;

        this.eventController = new AbortController();
        const { signal } = this.eventController;
        
        // add event listener
        this.addEventListener = function(type, listener, options = {}){
            options.signal = signal ;
            this.container.addEventListener(type, listener, options) ;
        };

        let jsRunDone = false;
        if(this.sourcesPrepared() && VIEWS[this.viewId].sources.jsFunction){
            //the sources is already prepared, run the JS immediatly
            jsRunDone = true;
            await VIEWS[this.viewId].sources.jsFunction(this);
        }


        if(!ssr && (!this.sourcesPrepared() || this.fetchData)){
            // If the HTML is not yet available or there is data to fetch, add loaded inside the container
            container.innerHTML = this.loader;
        }else{
            waiter(new Promise((resolve)=>{
                this.addEventListener("displayed", resolve, {once: true});
            }));
        }

        await this.prepareSources({ssr});

        if(!jsRunDone && VIEWS[this.viewId].sources.jsFunction){
            //the JS has not been run yet, run now
            await VIEWS[this.viewId].sources.jsFunction(this);
        }
        
        if(this.fetchData){
            this.data = await this.fetchData();
        }else{
            this.data = {};
        }

       /*if(this.container === container && this.container.getAttribute("z-view") === this.options.page){
            //already active, refresh
            // waiter(this.bind()).then(()=>{
            //     this.body.dispatchEvent(new CustomEvent("refresh"));
            // }) ;
            // return;
            return waiter(this.bind()).then(()=>{
                this.body.dispatchEvent(new CustomEvent("refresh"));
            }) ;
        }*/
        


        //this.container.setAttribute("z-view", this.options.page) ;

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

        this.bind();

        this.container.dispatchEvent(new CustomEvent("displayed"));


        //this.container.innerHTML = "<view-"+this.viewId+" id=\""+this.instanceId+"\" class=\"view-controller-container\"></view-"+this.viewId+">" ;
       /* this.body = this.container.querySelector("view-"+this.viewId) ;
        this.shadowRoot = this.body.shadowRoot;
        this.shadowRoot._viewController = this ;*/

        //waiter();

        

        // .then(()=>{
        //     bodyEl.style.display = "" ;

            
            
        // }), self.container).finally(()=>{
            
        // }) ;
    }
}