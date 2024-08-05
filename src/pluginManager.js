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
    let pluginsToLoad = [];
    for(let dir of pluginDirectories){
        let subdirs = (await readdir(dir, { withFileTypes: true }))
                .filter(dirent => dirent.isDirectory())
                .map(dirent => dirent.name);
        for(let pluginDir of subdirs){
            let pkg = require(path.join(dir, pluginDir , "package.json"));
            let plugin = await dynamicImport(pluginDir, dir) ;
            pluginsToLoad.push({pkg, depends: pkg?.openbamz?.depends??[] , plugin, id: pluginDir, path: path.join(dir, pluginDir) });
        }
    }
    pluginsToLoad = sortPluginByDependencies(pluginsToLoad) ;
    for(let pluginToLoad of pluginsToLoad){
        pluginsData[pluginToLoad.id] = await pluginToLoad.plugin.initPlugin(params);
        if(pluginsData[pluginToLoad.id].frontEndPath){
            pluginsData[pluginToLoad.id].frontEndFullPath = path.join(pluginToLoad.path ,pluginsData[pluginToLoad.id].frontEndPath);
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

function sortPluginByDependencies(arr) {
    // Create a map to store the objects by their id for quick access
    const objMap = new Map(arr.map(obj => [obj.id, obj]));

    // Create a map to track dependencies for each object
    const dependencies = new Map();
    const inDegree = new Map(); // to count the number of incoming edges for each object

    // Initialize dependencies and inDegree maps
    arr.forEach(obj => {
        inDegree.set(obj.id, 0);
        dependencies.set(obj.id, []);
    });

    // Fill the dependencies map and inDegree map
    arr.forEach(obj => {
        obj.depends.forEach(dep => {
            if (objMap.has(dep)) {
                dependencies.get(dep).push(obj.id);
                inDegree.set(obj.id, (inDegree.get(obj.id) || 0) + 1);
            }
        });
    });

    // Perform topological sorting using Kahn's algorithm
    const queue = [];
    const sortedArray = [];

    // Add objects with no dependencies (inDegree 0) to the queue
    inDegree.forEach((degree, id) => {
        if (degree === 0) {
            queue.push(id);
        }
    });

    while (queue.length) {
        const currentId = queue.shift();
        sortedArray.push(objMap.get(currentId));

        // Decrease the inDegree of dependent objects
        dependencies.get(currentId).forEach(depId => {
            inDegree.set(depId, inDegree.get(depId) - 1);
            if (inDegree.get(depId) === 0) {
                queue.push(depId);
            }
        });
    }

    //Can't be sorted because of circular reference
    let failedElements = arr.filter(o=>!sortedArray.some(a=>a.id === o.id))
    if(failedElements.length>0){
        logger.warn("The following plugins have circular dependencies, they are ignored %o", failedElements.map(o=>o.id).join(","))
    }
    return sortedArray;
}


module.exports.initPlugins = initPlugins;
module.exports.pluginsData = pluginsData;
module.exports.middlewareMenuJS = middlewareMenuJS;
module.exports.dynamicImport = dynamicImport;