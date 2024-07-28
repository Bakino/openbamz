const logger = require("./logger");
const express = require("express");
const path = require("path");
const fs = require("fs");
const { createIfNotExist, prepareSchema,prepareMainRoles, startWorkers, getConnectionInfo, preparePlugins } = require("./database/init");
const { createServer } = require("node:http");
const { Client } = require('pg');
const { initPlugins } = require("./pluginManager");

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
    const graphileConfig = require("./database/graphileConfig");
    const {postgraphile} = require("postgraphile");
    const { grafserv } = require("postgraphile/grafserv/express/v4");


    const app = express()
    const port = 3000

    initPlugins({app}) ;

    const graphServers = {} ;

    app.use("/openbamz/", express.static(path.join(__dirname, "openbamz-front") ));


    app.get("/_openbamz_admin.js", (req, res)=>{
        (async ()=>{
            let appName = req.query.appName ;
            let options = {
                user: process.env.DB_USER,
                password: process.env.DB_PASSWORD,
                host: process.env.DB_HOST,
                port: process.env.DB_PORT,
                database: appName
            }; 
            const client = new Client(options) ;
            try{
                await client.connect();
                //let results = await client.query("SELECT * FROM openbamz.plugins");        
                
                res.end(`
//script for ${req.query.appName}
window.OPENBAMZ_APP = '${req.query.appName}' ;
                `)
            }finally{
                client.end() ;
            }
        })() ;
    })

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
                startWorkers(options) ;
                const serv = postgraphile(graphileConfig.createAppPreset(options)).createServ(grafserv);
                graphServers[appName] = serv;
                serv.addTo(app, server).catch((e) => {
                    logger.error("Unexpected error %o", e);
                    process.exit(1);
                });   


                // Middleware to modify HTML content
                app.use("/app/"+appName,(req, res, next) => {
                    if (req.url.toLowerCase().endsWith('.html')) {
                        const filePath = path.join(process.env.DATA_DIR, "apps" ,appName, req.url);
                        
                        fs.readFile(filePath, 'utf8', (err, data) => {
                            if (err) { return next(err); }
                            
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
    const serv = postgraphile(graphileConfig.mainDbPreset).createServ(grafserv);

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