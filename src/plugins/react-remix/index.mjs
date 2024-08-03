import { createRequestHandler } from "@remix-run/express";
import { viteBuild } from "@remix-run/dev/dist/cli/commands.js";
import express from "express";
import path, { dirname } from "path";
import { access, constants, writeFile } from "fs/promises";
import { fileURLToPath } from "url";
import { copy } from "fs-extra";

export const prepareDatabase = async () => {

}

export const cleanDatabase = async () => {
}


export const initPlugin = async ({app, graphql, logger, runQuery}) => {
    const router = express.Router();

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);

    const handlersByAppName = {}

    async function getHandlers (appName){
        if(!handlersByAppName[appName]){
            await prepareHandlers (appName) ;
        }
        return handlersByAppName[appName];
    }

    async function prepareHandlers (appName){
        //https://github.com/nodejs/help/issues/2751
        //WARNING: we should have a regular server restart to clean memory :(
        const filesDirectory = path.join(process.env.DATA_DIR, "apps" ,appName);

        let build = await import(path.join(filesDirectory, `build/server/index.js?${Date.now()}`));
        let requestHandler = createRequestHandler({ build });
        let staticHandler = express.static(path.join(filesDirectory, "build/client"));
        handlersByAppName[appName] = { requestHandler, staticHandler } ;
    }

    //build react sources
    router.use("/build/:appName", (req, res)=>{
        (async ()=>{
            try{
                // Check user has proper authorization
                if(!await graphql.checkAppAccessMiddleware(req, res)){ return ;}

                let appName = req.params.appName;

                let hasPlugin = (await runQuery({database: appName}, "SELECT plugin_id FROM openbamz.plugins WHERE plugin_id='react-remix'")).rows.length>0;
                if(!hasPlugin){ return res.status(402).json({error: "Plugin react-remix not installed"});}
                
                const filesDirectory = path.join(process.env.DATA_DIR, "apps" ,appName);

                let configFile = path.join(filesDirectory, "vite.config.mjs");
                try {
                    await access(configFile, constants.F_OK)
                } catch (err) {
                    logger.debug("create config file", err);
                    let filesToCopy = ["package.json","node_modules"];
                    for(let f of filesToCopy){
                        await copy(path.join(__dirname, f), path.join(filesDirectory, f))
                    }

                    //create config file
                    await writeFile(configFile, `import { vitePlugin as remix } from "@remix-run/dev";
import { defineConfig } from "vite";

export default defineConfig({
  base: "/app/${appName}",
  plugins: [remix({basename: "/app/${appName}/"})],
});`, {encoding: "utf8"});
                }
                

                await viteBuild(filesDirectory, {/*config: path.join(__dirname, "vite.config.mjs")*/});
                await prepareHandlers(appName) ;
                res.json({ success: true })
            }catch(err){
                res.status(err.statusCode??500).json(err);
            }
        })();
    });

    app.use("/app/:appName", (req, res, next)=>{
        (async ()=>{
            try{
                let appName = req.params.appName;

                let hasPlugin = (await runQuery({database: appName}, "SELECT plugin_id FROM openbamz.plugins WHERE plugin_id='react-remix'")).rows.length>0;
                if(hasPlugin){
                    let handler = await getHandlers(appName) ;
                    return handler.staticHandler(req, res, next) ;
                }else{
                    next();
                }
            }catch(err){
                res.status(err.statusCode??500).json(err);
            }
        })();
    });
     
    //router.use(express.static(path.join(__dirname, "build/client")));

    //let build = await import("./build/server/index.js");

    //let requestHandler = createRequestHandler({ build });
    // router.all("*", (req, res, next)=>{
    //     requestHandler(req, res, next) ;
    // });
    app.all("*", (req, res, next)=>{
        (async ()=>{
            try{
                if(!req.originalUrl.startsWith("/app/")){ return next() ; }
                let appName = req.originalUrl.replace(/^\/app\/{0,1}/, "") ; ;
                let slashIndex = appName.indexOf("/"); 
                if(slashIndex !== -1){
                    appName = appName.substring(0, slashIndex) ;
                }
                if(!appName || appName === process.env.DB_NAME){
                    return next();
                }

                let hasPlugin = (await runQuery({database: appName}, "SELECT plugin_id FROM openbamz.plugins WHERE plugin_id='react-remix'")).rows.length>0;
                if(hasPlugin){
                    let handler = await getHandlers(appName) ;
                    const originalWrite = res.write;
                    const bodyChunks = [];

                    // Override the write method
                    res.write = function(chunk) {
                        bodyChunks.push(chunk);
                    };

                    // Override the end method
                    const originalEnd = res.end;
                    res.end = function(chunk) {
                        if (chunk) {
                        bodyChunks.push(chunk);
                        }

                        // Concatenate all chunks
                        let body = Buffer.concat(bodyChunks).toString('utf8');

                        // Modify the body
                        body = body.replace('<body>', `<body><script src="/_openbamz_admin.js?appName=${appName}"></script>`);

                        // Reset write and end methods
                        res.write = originalWrite;
                        res.end = originalEnd;

                        // Set the new Content-Length
                        res.setHeader('Content-Length', Buffer.byteLength(body));

                        // Send the modified response
                        res.end(body);
                    };
                    return handler.requestHandler(req, res, next) ;
                }else{
                    next();
                }
            }catch(err){
                res.status(err.statusCode??500).json(err);
            }
        })();
    });

    return {
        // path in which the plugin provide its front end files
        frontEndPath: "html",
        router: router,
        //menu entries
        menu: [
            {
                name: "admin", entries: [
                    { name: "Build react", link: "/plugin/:appName/react-remix/" }
                ]
            }
        ]
    }
}