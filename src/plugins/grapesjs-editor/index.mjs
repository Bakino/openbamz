import express from 'express';

export const prepareDatabase = async () => {

}

export const cleanDatabase = async () => {
}


export const initPlugin = async ({context, graphql, runQuery}) => {
    
    // Register GrapesJS to the standard code editor plugin
    context.plugins.codeEditor.registerExtension({
        plugin: "grapesjs-editor",
        extensionPath: "/plugin/:appName/grapesjs-editor/grapesjs-editor-extension.mjs"
    });


    // Allow other plugins to add extension to GrapesJS editor

    const EXTENSIONS_PLUGINS = [
        /*{
            plugin: "code-editor",
            extensionPath: "/plugin/:appName/code-editor/js/code-editor-monaco.mjs"
        }*/
    ];

    context.plugins.grapesJsEditor = {
        registerExtension : (extension)=>EXTENSIONS_PLUGINS.push(extension)
    };

    const router = express.Router();

    router.get('/grapesjs-extensions-allowed/:appName', (req, res) => {
        (async ()=>{
            if(!await graphql.checkAppAccessMiddleware(req, res)){ return ;}

            let allPlugins = (await runQuery({database: req.params.appName}, "SELECT plugin_id FROM openbamz.plugins ")).rows;
            let allowedExtensions = EXTENSIONS_PLUGINS.filter(extension=>allPlugins.some(p=>p.plugin_id === extension.plugin));
            
            res.json(allowedExtensions);
        })();
    })

    router.get('/grapesjs-extensions', (req, res) => {
        (async ()=>{
            

            //let allPlugins = (await runQuery({database: req.params.appName}, "SELECT plugin_id FROM openbamz.plugins ")).rows;
            //let allowedExtensions = EXTENSIONS_PLUGINS.filter(extension=>allPlugins.some(p=>p.plugin_id === extension.plugin));
            let allowedExtensions = EXTENSIONS_PLUGINS
            let js = `let extensions = [];`;
            for(let i=0; i<allowedExtensions.length; i++){
                let ext = allowedExtensions[i];
                js += `
                import ext${i} from "${ext.extensionPath.replace(":appName", "app")}" ;
                extensions.push({ plugin: "${ext.plugin}", ...ext${i}}) ;
                `
            }
            js += `export default extensions`;
            res.setHeader("Content-Type", "text/javascript");
            res.end(js);
        })();
    });

    return {
        // path in which the plugin provide its front end files
        frontEndPath: "html",
        router: router,
        //menu entries
        // menu: [
        //     {
        //         name: "admin", entries: [
        //             { name: "Grapjs editor", link: "/plugin/:appName/grapesjs-editor/" }
        //         ]
        //     }
        // ]
    }
}