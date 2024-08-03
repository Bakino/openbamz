const logger = require("./logger");
const express = require("express");
const bodyParser = require('body-parser')
const path = require("path");
const fs = require("fs");
const { createIfNotExist, prepareSchema,prepareMainRoles, startWorkers, preparePlugins } = require("./database/init");
const { createServer } = require("node:http");
const { initPlugins, middlewareMenuJS } = require("./pluginManager");
const graphql = require("./database/graphql");
const { getConnectionInfo, runQuery, runQueryMain, getDbClient } = require("./database/dbAccess");

process.env.GRAPHILE_ENV = process.env.PROD_ENV 

// Main DB connection information from env variables
const mainDatabaseConnectionOptions = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
};

// Prepare the main database
async function prepare() {
    logger.info("Prepare main database %o", mainDatabaseConnectionOptions)
    try {
        logger.info("Create database");
        await createIfNotExist(mainDatabaseConnectionOptions);
        logger.info("Prepare database");
        await prepareSchema(mainDatabaseConnectionOptions, "_openbamz");
        await prepareMainRoles(mainDatabaseConnectionOptions);
        logger.info("Prepare database done");

        //Start workers
        startWorkers(mainDatabaseConnectionOptions).catch((err) => {
            logger.warn(err);
            process.exit(1);
        });
    } catch (err) {
        logger.error("Fail to init database %o", err);
        throw err;
    }
}

// Start server
async function start() {
    const { grafserv } = require("postgraphile/grafserv/express/v4");


    const app = express()
    const port = 3000

    // parse application/x-www-form-urlencoded
    app.use(bodyParser.urlencoded({ extended: false }))

    // parse application/json
    app.use(bodyParser.json())


    let pluginsData = await initPlugins({app, logger, graphql, runQuery, runQueryMain, getDbClient}) ;

    // Middleware to modify HTML content
    app.use(["/app/*", "/plugin/*"],(req, res, next) => {
        //FIXME: refactor appName extraction
        let appName = req.baseUrl.replace(/^\/plugin\//, "").replace(/^\/app\/{0,1}/, "") ; ;
        let slashIndex = appName.indexOf("/");
        if(slashIndex !== -1){
            appName = appName.substring(0, slashIndex) ;
        }
        if(appName && appName !== process.env.DB_NAME){
            if (req.originalUrl.toLowerCase().endsWith('.html') || req.originalUrl.endsWith('/') ) {
                //'/app/plug/plugin/database-admin-basic'
                let relativePath = null;
                let basePath = null; 
                if(req.baseUrl.startsWith("/app")){
                    //file in app sources
                    relativePath = req.baseUrl.replace(`/app/${appName}`, '').replace(/^\//, "");;
                    basePath = path.join(process.env.DATA_DIR, "apps" ,appName);
                }else{
                    //file in plugin
                    let pluginName = req.baseUrl.replace(/^\/plugin\//, "").replace(/^\/app\//, "").replace(appName, "") .replace(/^\//, ""); 
                    let slashIndex = pluginName.indexOf("/");
                    if(slashIndex !== -1){
                        pluginName = pluginName.substring(0, slashIndex) ;
                    }
                    //get base path from plugins data
                    basePath = pluginsData[pluginName]?.frontEndFullPath
                    relativePath = req.baseUrl.replace(`/plugin/${appName}/${pluginName}`, '');
                }
                if(!basePath){
                    //no base path, maybe try to load a plugin that does not exists anymore
                    return next() ;
                }
                let filePath = path.join(basePath, relativePath);
                if(req.url.endsWith('/')){
                    filePath = path.join(filePath, "index.html") ;
                }
                
                fs.readFile(filePath, 'utf8', (err, data) => {
                    if (err) { 
                        //error reading file, continue with standard
                        return next(); 
                    }
                    
                    // Modify HTML content here
                    let modifiedHtml = data;
                    // Example modification: Inject a script tag
                    modifiedHtml = modifiedHtml.replace('<body>', `<body><script src="/_openbamz_admin.js?appName=${appName}"></script>`);
                    
                
                    res.setHeader('Content-Type', 'text/html');
                    res.end(modifiedHtml);
                });
            } else {
                next();
            }
        }else{
            next() ;
        }
    });

    //Register after the middleware to modify HTML
    for(let pluginDir of Object.keys(pluginsData)){
        if(pluginsData[pluginDir].frontEndPath){
            app.use(`/plugin/:appName/${pluginDir}/`, express.static(pluginsData[pluginDir].frontEndFullPath));
        }
        if(pluginsData[pluginDir].router){
            logger.info(`Register routing /${pluginDir}/`);
            app.use(`/${pluginDir}/`, pluginsData[pluginDir].router);
        }
    }

    const graphServers = {} ;

    app.use("/openbamz/", express.static(path.join(__dirname, "openbamz-front") ));


    app.get("/_openbamz_admin.js", middlewareMenuJS);

    app.use(["/graphql/*", "/graphiql/*", "/app/*"], (req, res, next)=>{
        // initialize graphql and static files serve
        let appName = req.baseUrl.replace(/^\/graph[i]{0,1}ql\//, "").replace(/^\/app\/{0,1}/, "") ; ;
        let slashIndex = appName.indexOf("/");
        if(slashIndex !== -1){
            appName = appName.substring(0, slashIndex) ;
        }
        if(appName && appName !== process.env.DB_NAME && !graphServers[appName]){
            let options;
            getConnectionInfo(mainDatabaseConnectionOptions, appName).then((account)=>{
                if(!account){
                    logger.warn(`No account information for ${appName}`) ;
                    return ;
                }
                options = {
                    user: account._id,
                    password: account.password,
                    superuser: process.env.DB_USER,
                    superpassword: process.env.DB_PASSWORD,
                    host: process.env.DB_HOST,
                    port: process.env.DB_PORT,
                    database: appName
                }; 

                return preparePlugins(options);
            }).then(()=>{
                return graphql.getDbGraphql(appName);
            }).then((pgl)=>{
                startWorkers(options) ;
                const serv = pgl.createServ(grafserv);
                graphServers[appName] = serv;
                serv.addTo(app, server).catch((e) => {
                    logger.error("Unexpected error %o", e);
                    process.exit(1);
                });   


                
                app.use("/app/"+appName, express.static(path.join(process.env.DATA_DIR, "apps" ,appName) ));
            }).catch(err=>{
                logger.error(`Error while get account information of database ${appName} %o`, err) ;
            }).finally(()=>{
                next() ;
            })
                     
        }else{
            //graphql already loaded
            next() ;
        }
    });


    // Create a Node HTTP server, mounting Express into it
    const server = createServer(app);
    server.on("error", (e) => {
        logger.error("Unexpected error %o", e);
    });
    const pgl = await graphql.getMainGraphql();
    const serv = pgl.createServ(grafserv);

    serv.addTo(app, server).catch((e) => {
        logger.error("Unexpected error %o", e);
        process.exit(1);
    });

    server.listen(port, () => {
        logger.info(`OpenBamz listening on port ${port}`)
        logger.info(
            `GraphiQL (GraphQL IDE) endpoint: http://localhost:${port}/graphql`
        );
    })
}


prepare().then(start);