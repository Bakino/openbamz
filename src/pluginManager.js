const path = require("path") ;
const { readdir, readFile } = require('node:fs/promises');
const express = require("express");
const { Client } = require('pg');
const logger = require("./logger");
let pluginsData = {} ;

//init all plugins on application start
async function initPlugins(params){
    pluginsData = {} ;
    const pluginDirectories = [path.join(__dirname, "plugins")] ;
    for(let dir of pluginDirectories){
        let subdirs = (await readdir(dir, { withFileTypes: true }))
                .filter(dirent => dirent.isDirectory())
                .map(dirent => dirent.name);
        for(let pluginDir of subdirs){
            let plugin = require(path.join(dir, pluginDir, "index.js")) ;
            pluginsData[pluginDir] = await plugin.initPlugin(params);
            if(pluginsData[pluginDir].frontEndPath){
                pluginsData[pluginDir].frontEndFullPath = path.join(dir, pluginDir,pluginsData[pluginDir].frontEndPath);
                params.app.use(`/plugin/:appName/${pluginDir}/`, express.static(pluginsData[pluginDir].frontEndFullPath));
            }
            if(pluginsData[pluginDir].router){
                params.app.use(`/${pluginDir}/`, pluginsData[pluginDir].router);
            }
        }
    }
    return pluginsData;
}

const BASE_MENU = [
    { name: "&#127968;",  link: "/app/:appName", entries: [
        { name: "Home", link: "/app/:appName" },
        { name: "All apps", link: "/openbamz" }
    ] } 
    /* { name: "admin", entries: [
         { name: "database", link: "/database" },
         { name: "sources", link: "/sources" }
     ] },
     { name: "settings", entries: [
         { name: "main", link: "/mainsettings" },
         { name: "profile", link: "/profile" }
     ] }*/
];

function middlewareMenuJS(req, res){
    (async ()=>{
        let appName = req.query.appName ;
        let options = {
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            host: process.env.DB_HOST,
            port: process.env.DB_PORT,
            database: appName
        }; 
        //FIXME: use a pool ?
        const client = new Client(options) ;
        try{
            await client.connect();
            let results;
            try{
                results = await client.query("SELECT plugin_id FROM openbamz.plugins");  
            }catch(err){
                logger.warn("Can't load plugins from db %o", err);
                results = { rows: [] } ;
            }
            let adminMenu = JSON.parse(JSON.stringify(BASE_MENU)) ;
            for(let plugin of results.rows){
                let pluginData = pluginsData[plugin.plugin_id] ;
                if(pluginData?.menu){
                    for(let menu of pluginData.menu){
                        let menuEntry = adminMenu.find(m=>m.name === menu.name) ;
                        if(!menuEntry){
                            menuEntry = {
                                name: menu.name,
                                entries : []
                            };
                            adminMenu.push(menuEntry) ;
                        }
                        for(let entry of menu.entries){
                            menuEntry.entries.push(entry) ;
                        }
                    }
                }
            }
            let jsSource = await readFile(path.join(__dirname, "menu-front", "adminMenu.js"), {encoding: "utf8"}) ;
            res.end(`
//script for ${req.query.appName}
window.OPENBAMZ_APP = '${req.query.appName}' ;


let adminMenu = ${JSON.stringify(adminMenu)} ;

${jsSource}
            `)
        }catch(err){
            logger.warn("Can't load plugin %o", err);
            res.end(`//script for ${req.query.appName}
window.OPENBAMZ_APP = '${req.query.appName}' ;
`)
        }finally{
            client.end() ;
        }
    })() ;
}

module.exports.initPlugins = initPlugins;
module.exports.pluginsData = pluginsData;
module.exports.middlewareMenuJS = middlewareMenuJS;