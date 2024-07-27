const logger = require("./logger");
const express = require("express");
const path = require("path");
const { createIfNotExist, prepareSchema,prepareMainRoles, startWorkers, getConnectionInfo } = require("./database/init");
const { createServer } = require("node:http");

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

    const graphServers = {} ;

    app.use(["/graphql/*", "/graphiql/*", "/static/*"], (req, res, next)=>{
        // initialize graphql and static files serve
        let appName = req.baseUrl.replace(/^\/graph[i]{0,1}ql\//, "") ;
        let slashIndex = appName.indexOf("/");
        if(slashIndex !== -1){
            appName = appName.substring(0, slashIndex) ;
        }
        if(appName && appName !== process.env.DB_NAME && !graphServers[appName]){
            getConnectionInfo(mainDatabaseConnectionOptions, appName).then((account)=>{
                if(!account){
                    logger.warn(`No account information for ${appName}`) ;
                    return ;
                }
                let options = {
                    user: account._id,
                    password: account.password,
                    superuser: process.env.DB_USER,
                    superpassword: process.env.DB_PASSWORD,
                    host: process.env.DB_HOST,
                    port: process.env.DB_PORT,
                    database: appName
                }; 
                const serv = postgraphile(graphileConfig.createAppPreset(options)).createServ(grafserv);
                graphServers[appName] = serv;
                serv.addTo(app, server).catch((e) => {
                    logger.error("Unexpected error %o", e);
                    process.exit(1);
                });   

                app.use("/static/"+appName, express.static(path.join(process.env.DATA_DIR, "apps" ,appName) ));

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


    app.use("/static/test", express.static(path.join(process.env.DATA_DIR, "apps" ,"test") ));

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