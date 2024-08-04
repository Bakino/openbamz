import path from "path";
import { generateSsrContent } from "./viewzSsr.mjs";

export const prepareDatabase = async () => {

}

export const cleanDatabase = async () => {
}


export const initPlugin = async ({app, runQuery, logger}) => {
    
    /*const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);

    app.use("/plugin/:appName/viewz/", (req, res, next)=>{
        (async ()=>{
            try{

                let sourcePath = path.join(__dirname, "html");
                let base = "";
                let containerId = "container";
    
                let html = await readFile(path.join(sourcePath, "index.html"), {encoding: "utf8"});
                let dom = new JSDOM(html);
                let routes = await fs.readJson(path.join(sourcePath, "routes.json"));
                let baseEl = dom.window.document.head.querySelector("base");
                if(baseEl){
                    base = baseEl.getAttribute("href").replace(/\/$/, "") ;
                }
                for(let route of routes){
                    route.regexp = pathToRegexp((base??"")+route.route)
                }
    
                let route = routes.find(r=>r.regexp.exec(req.originalUrl)) ;
                if(route){
                    let viewName = route.name;
                    if(!viewName){
                        viewName = route.path.replace(/\/$/, "").substring(route.path.lastIndexOf("/")+1);
                    }
                    
                    let html = await readFile(path.join(sourcePath, `${route.path}/${viewName}.html`), {encoding: "utf8"});
                    let css = await readFile(path.join(sourcePath, `${route.path}/${viewName}.css`), {encoding: "utf8"});
                    let js = await readFile(path.join(sourcePath, `${route.path}/${viewName}.js`), {encoding: "utf8"});
    
                    if(css){
                        //TODO : when @scope is supported on FF and Safari, add it directly from here
                        css = `<style scoped>
                        ${css}</style>`
                        
                    }
                    //let template = dom.window.document.createElement("template") ;
                    let container = dom.window.document.getElementById(containerId);
                    container.setAttribute("zz-ssr", viewName);
                    container.innerHTML = `${css}${html}` ;
                    
                   // dom.document.body.appendChild(template) ;
                   res.end(dom.serialize()) ;
                }else{
                    next();
                }
            }catch(err){
                logger.error("Error while get SSR page %o", err);
                res.status(err.statusCode||500).json(err);
            }
            
        })();
    })*/


    const handlersByAppName = {}

    async function getHandlers (appName){
        if(!handlersByAppName[appName]){
            await prepareHandlers (appName) ;
        }
        return handlersByAppName[appName];
    }

    async function prepareHandlers (appName){
        const sourcePath = path.join(process.env.DATA_DIR, "apps" ,appName);

        let requestHandler = await generateSsrContent({ sourcePath });
        handlersByAppName[appName] = { requestHandler } ;
    }

    app.use("/app/:appName", (req, res, next)=>{
        (async ()=>{
            try{
                let appName = req.params.appName;

                let hasPlugin = (await runQuery({database: appName}, "SELECT plugin_id FROM openbamz.plugins WHERE plugin_id='viewz'")).rows.length>0;
                if(hasPlugin){
                    let handler = await getHandlers(appName) ;
                    let html = await handler.requestHandler(req) ;
                    if(!html){ return next() ; }
                    //inject openbamz admin banner
                    html = html.replace('<body>', `<body><script src="/_openbamz_admin.js?appName=${appName}"></script>`);
                    res.end(html) ;
                }else{
                    next();
                }
            }catch(err){
                logger.error("Error while handling app SSR request %o", err);
                res.status(err.statusCode??500).json(err);
            }
        })();
    });

    return {
        // path in which the plugin provide its front end files
        frontEndPath: "html",
        //router: router,
        //menu entries
        menu: [
            {
                name: "admin", entries: [
                    { name: "View Z", link: "/plugin/:appName/viewz/" }
                ]
            }
        ]
    }
}