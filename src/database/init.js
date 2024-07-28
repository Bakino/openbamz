const { Client } = require('pg');
const logger = require("../logger") ;
const { readFile } = require('node:fs/promises');
const path = require("path") ;
const { run, Logger } = require("graphile-worker");
const fs = require('fs-extra')


async function createIfNotExist(options){
    const client = new Client(options) ;
    try{
        await client.connect();
        logger.debug("Database connection OK");
    }catch(err){
        if(err.message && err.message.indexOf("ECONNREFUSED") !== -1){
            throw err;
        }
        //likely db does not exists
        logger.info("Database "+options.database+"does not exists, try to create");
        let optionsCreate = {} ;
        Object.keys(options).forEach((k)=>{
            optionsCreate[k] = options[k] ;
        }) ;
        optionsCreate.database = "postgres" ;
        const clientCreate = new Client(optionsCreate) ;
        try{
            await clientCreate.connect();
            await clientCreate.query("CREATE DATABASE "+options.database, []);
        }finally{
            clientCreate.end() ;
        }
        
    }finally{
        client.end() ;
    }
}

async function prepareSchema(options, schemaName){
    const client = new Client(options) ;
    try{
        await client.connect();

        let sql = await readFile(path.join(__dirname, schemaName+".sql"), {encoding: "utf8"}) ;
        logger.info("start run query");
        await client.query(sql);        
        logger.info("end run query");
    }finally{
        client.end() ;
    }
}

async function prepareMainRoles(options, schemaName){
    const client = new Client(options) ;
    try{
        await client.connect();

        let role = "normal_user";
        let result = await client.query("SELECT 1 FROM pg_catalog.pg_roles WHERE rolname =  $1", [role]);
        if(result.rows.length === 0){
            logger.info(`create ROLE ${role}`);
            await client.query(`CREATE ROLE ${role}
                NOSUPERUSER
                NOCREATEDB
                NOCREATEROLE
                NOREPLICATION`)

        } 

        
        await client.query(`GRANT ALL PRIVILEGES ON DATABASE ${options.database} TO ${role}`)


        await client.query(`GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO ${role}`)

        //await client.query(`GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO ${role}`)

        //await client.query(`GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO ${role}`)

        //await client.query(`ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO ${role}`)
        //await client.query(`ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO ${role}`)
        //await client.query(`ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO ${role}`)

        let roleAnonymous = "anonymous";
        result = await client.query("SELECT 1 FROM pg_catalog.pg_roles WHERE rolname =  $1", [roleAnonymous]);
        if(result.rows.length === 0){
            logger.info(`create ROLE ${roleAnonymous}`);
            await client.query(`CREATE ROLE ${roleAnonymous}
                NOSUPERUSER
                NOCREATEDB
                NOCREATEROLE
                NOREPLICATION`)

        } 

        let roleAdmin = "admin";
        result = await client.query("SELECT 1 FROM pg_catalog.pg_roles WHERE rolname =  $1", [roleAdmin]);
        if(result.rows.length === 0){
            logger.info(`create ROLE ${roleAdmin}`);
            await client.query(`CREATE ROLE ${roleAdmin}
                NOSUPERUSER
                CREATEDB
                CREATEROLE
                REPLICATION`)

        } 
        
        await client.query(`GRANT ALL PRIVILEGES ON DATABASE ${options.database} TO ${roleAdmin}`)


        for(let schemaName of [ "public", "private"]){
            await client.query(`GRANT ALL PRIVILEGES ON SCHEMA ${schemaName} TO ${roleAdmin}`)
            await client.query(`GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA ${schemaName} TO ${roleAdmin}`)
    
            await client.query(`GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA ${schemaName} TO ${roleAdmin}`)
    
            await client.query(`GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA ${schemaName} TO ${roleAdmin}`)
            await client.query(`GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA ${schemaName} TO ${roleAdmin}`)
            await client.query(`GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA ${schemaName} TO ${roleAdmin}`)
    
            await client.query(`GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA ${schemaName} TO ${roleAdmin}`)
    
            await client.query(`ALTER DEFAULT PRIVILEGES IN SCHEMA ${schemaName} GRANT ALL ON TABLES TO ${roleAdmin}`)
            await client.query(`ALTER DEFAULT PRIVILEGES IN SCHEMA ${schemaName} GRANT ALL ON SEQUENCES TO ${roleAdmin}`)
            await client.query(`ALTER DEFAULT PRIVILEGES IN SCHEMA ${schemaName} GRANT ALL ON FUNCTIONS TO ${roleAdmin}`)
        }

    }finally{
        client.end() ;
    }
} 

async function getConnectionInfo(options, database){

    const client = new Client(options) ;
    try{
        await client.connect();

        let result = await client.query(`SELECT acc.* FROM app a 
            JOIN private.account acc ON a.owner = acc._id
            WHERE a.code =  $1`, [database]);
        let appAccount = result.rows[0] ;

        return appAccount;
    }finally{
        client.end() ;
    }
}

async function prepareRole(options, account){
    const client = new Client(options) ;
    try{
        await client.connect();

        let role = options.database+"_admin";
        let result = await client.query("SELECT 1 FROM pg_catalog.pg_roles WHERE rolname =  $1", [role]);
        if(result.rows.length === 0){
            logger.info(`create ROLE ${role}`);
            await client.query(`CREATE ROLE ${role}
                NOSUPERUSER
                NOCREATEDB
                NOCREATEROLE
                NOREPLICATION;`)
        } 

        await client.query(`GRANT ${role} TO "${account._id}"`)

        await client.query(`GRANT ALL PRIVILEGES ON DATABASE ${options.database} TO ${role}`)


        await client.query(`GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ${role}`)

        await client.query(`GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO ${role}`)

        await client.query(`GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO ${role}`)

        await client.query(`ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO ${role}`)
        await client.query(`ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO ${role}`)
        await client.query(`ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO ${role}`)
        await client.query(`ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO ${role}`)
        await client.query(`ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO ${role}`)
        await client.query(`ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO ${role}`)

        let roleUser = options.database+"_user";
        result = await client.query("SELECT 1 FROM pg_catalog.pg_roles WHERE rolname =  $1", [roleUser]);
        if(result.rows.length === 0){
            logger.info(`create ROLE ${roleUser}`);
            await client.query(`CREATE ROLE ${roleUser}
                NOSUPERUSER
                NOCREATEDB
                NOCREATEROLE
                NOREPLICATION;`)
        } 

        await client.query(`GRANT SELECT, UPDATE, INSERT, DELETE ON ALL TABLES IN SCHEMA public TO ${roleUser}`)
        await client.query(`GRANT SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO ${roleUser}`)
        await client.query(`GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO ${roleUser}`)
        await client.query(`ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, UPDATE, INSERT, DELETE ON TABLES TO ${roleUser}`)
        await client.query(`ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, UPDATE ON SEQUENCES TO ${roleUser}`)
        await client.query(`ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO ${roleUser}`)
        await client.query(`ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT SELECT, UPDATE, INSERT, DELETE ON TABLES TO ${roleUser}`)
        await client.query(`ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT SELECT, UPDATE, INSERT, DELETE ON TABLES TO ${roleUser}`)
        await client.query(`ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT SELECT, UPDATE ON SEQUENCES TO ${roleUser}`)
        await client.query(`ALTER DEFAULT PRIVILEGES FOR ROLE ${role} IN SCHEMA public GRANT SELECT, UPDATE ON SEQUENCES TO ${roleUser}`)
        await client.query(`ALTER DEFAULT PRIVILEGES FOR ROLE ${role} IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO ${roleUser}`)
        await client.query(`ALTER DEFAULT PRIVILEGES FOR ROLE ${role} IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO ${roleUser}`)


        let roleReadonly = options.database+"_readonly";
        result = await client.query("SELECT 1 FROM pg_catalog.pg_roles WHERE rolname =  $1", [roleReadonly]);
        if(result.rows.length === 0){
            logger.info(`create ROLE ${roleReadonly}`);
            await client.query(`CREATE ROLE ${roleReadonly}
                NOSUPERUSER
                NOCREATEDB
                NOCREATEROLE
                NOREPLICATION;`)
        } 

        await client.query(`GRANT SELECT ON ALL TABLES IN SCHEMA public TO ${roleReadonly}`)

        await client.query(`ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO ${roleReadonly}`)
        await client.query(`ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT SELECT ON TABLES TO ${roleReadonly}`)
        await client.query(`ALTER DEFAULT PRIVILEGES FOR ROLE ${role} IN SCHEMA public GRANT SELECT ON TABLES TO ${roleReadonly}`)
        


        logger.info("Finish GRANT");
    }finally{
        client.end() ;
    }
} 


async function startWorkers(options) {
  // Run a worker to execute jobs:
  const runner = await run({
    connectionString: `postgres://${options.user}:${options.password}@${options.host}:${options.port}/${options.database}`,
    concurrency: 5,
    logger: new Logger((scope)=>{
        return (level, message, meta)=>{
            if(level === "warning"){ level = "warn" ;}
            logger.log({level, message})
        }
    }),
    crontabFile: path.join(__dirname, "crontab"),
    // Install signal handlers for graceful shutdown on SIGINT, SIGTERM, etc
    noHandleSignals: false,
    pollInterval: 1000,
    // you can set the taskList or taskDirectory but not both
    taskDirectory: `${__dirname}/tasks`,
  });

  // Immediately await (or otherwise handle) the resulting promise, to avoid
  // "unhandled rejection" errors causing a process crash in the event of
  // something going wrong.
  await runner.promise;

  // If the worker exits (whether through fatal error or otherwise), the above
  // promise will resolve/reject.
}

const BASE_DIR = path.join(process.env.DATA_DIR, "apps") ;
async function prepareAppDirectory(options) {
    logger.info("CREATE DIRECTORY "+path.join(BASE_DIR, options.database))
    await fs.ensureDir(path.join(BASE_DIR, options.database)) ;
    logger.info("WRITE FILE "+path.join(BASE_DIR, options.database, "index.html"))
    await fs.writeFile(path.join(BASE_DIR, options.database, "index.html"),`<html><body>Hello ${options.database}</body></html>`, {encoding: "utf8"})
}

async function deleteAppDirectory(options) {
    logger.info("REMOVE DIRECTORY "+path.join(BASE_DIR, options.database))
    await fs.remove(path.join(BASE_DIR, options.database)) ;
}


module.exports.createIfNotExist = createIfNotExist;
module.exports.prepareSchema = prepareSchema;
module.exports.prepareMainRoles = prepareMainRoles;
module.exports.startWorkers = startWorkers;
module.exports.prepareRole = prepareRole;
module.exports.getConnectionInfo = getConnectionInfo;
module.exports.prepareAppDirectory = prepareAppDirectory;
module.exports.deleteAppDirectory = deleteAppDirectory;