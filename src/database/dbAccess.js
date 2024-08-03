const { Pool } = require('pg');


// Main DB connection information from env variables
const MAIN_DB_OPTIONS = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
};

const POOLS = {} ;
async function getDbClient(options){
    let opt = JSON.parse(JSON.stringify(MAIN_DB_OPTIONS));
    for(let k of Object.keys(options)){
        opt[k] = options[k];
    }
    let key = JSON.stringify(opt) ;
    let pool = POOLS[key] ;
    if(!pool){
        pool = new Pool(opt);
        POOLS[key] = pool;
    }
    const client = await pool.connect()
    return client;
}   

async function getMainDbClient(){
    return await getDbClient(MAIN_DB_OPTIONS) ;
}

async function runQuery(options, query, params){
    let client = await getDbClient(options) ;
    try{
        let results = await client.query(query, params);
        return results;
    }finally{
        client.release();
    }
}

async function runQueryMain(query, params){
    let client = await getMainDbClient() ;
    let results = await client.query(query, params);
    client.release();
    return results;
}

async function getConnectionInfo(options, database){
    let result = await runQuery(options, `SELECT acc.* FROM app a 
        JOIN private.account acc ON a.owner = acc._id
        WHERE a.code =  $1`, [database]);
    let appAccount = result.rows[0] ;

    return appAccount;
}

module.exports.MAIN_DB_OPTIONS = MAIN_DB_OPTIONS;
module.exports.getConnectionInfo = getConnectionInfo;
module.exports.runQueryMain = runQueryMain;
module.exports.runQuery = runQuery;
module.exports.getMainDbClient = getMainDbClient;
module.exports.getDbClient = getDbClient;

