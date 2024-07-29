const path = require("path") ;
const { readdir } = require('node:fs/promises');
const express = require("express");
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
        }
    }
    return pluginsData;
}

module.exports.initPlugins = initPlugins;
module.exports.pluginsData = pluginsData;