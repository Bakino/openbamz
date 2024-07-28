const path = require("path") ;
const { readdir } = require('node:fs/promises');


//init all plugins on application start
async function initPlugins(params){
    const pluginDirectories = [path.join(__dirname, "plugins")] ;
    for(let dir of pluginDirectories){
        let subdirs = (await readdir(dir, { withFileTypes: true }))
                .filter(dirent => dirent.isDirectory())
                .map(dirent => dirent.name);
        for(let pluginDir of subdirs){
            let plugin = require(path.join(dir, pluginDir, "index.js")) ;
            plugin.initPlugin(params)
        }
    }
}

module.exports.initPlugins = initPlugins;