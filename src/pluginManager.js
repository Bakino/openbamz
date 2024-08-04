const path = require("path") ;
const { readdir, readFile } = require('node:fs/promises');
const logger = require("./logger");
const { getDbClient } = require("./database/dbAccess");
const { access, constants } = require("fs/promises");
let pluginsData = {} ;

const pluginDirectories = [path.join(__dirname, "plugins")] ;

async function dynamicImport(pluginName, pluginDir) {
    if(!pluginDir){
        for(let dir of pluginDirectories){
            try{
                await access(path.join(dir, pluginName), constants.F_OK);
                pluginDir = dir;
                break;
            }catch(err){
                //not exists
                logger.debug("Plugin "+pluginName+" does not exists in "+dir, err) ;
            }
        }
    }
    let modulePath = path.join(pluginDir, pluginName) ;
    let pkg = require(path.join(modulePath, "package.json"));
    if(pkg.type === "module"){
        return import(path.join(modulePath, pkg.main))
    }else{
        return require(path.join(modulePath, pkg.main))
    }
}

//init all plugins on application start
async function initPlugins(params){
    pluginsData = {} ;
    for(let dir of pluginDirectories){
        let subdirs = (await readdir(dir, { withFileTypes: true }))
                .filter(dirent => dirent.isDirectory())
                .map(dirent => dirent.name);
        for(let pluginDir of subdirs){
            let plugin = await dynamicImport(pluginDir, dir) ;
            pluginsData[pluginDir] = await plugin.initPlugin(params);
            if(pluginsData[pluginDir].frontEndPath){
                pluginsData[pluginDir].frontEndFullPath = path.join(dir, pluginDir,pluginsData[pluginDir].frontEndPath);
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
        const client = await getDbClient(options) ;
        try{
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
            client.release() ;
        }
    })() ;
}

module.exports.initPlugins = initPlugins;
module.exports.pluginsData = pluginsData;
module.exports.middlewareMenuJS = middlewareMenuJS;
module.exports.dynamicImport = dynamicImport;