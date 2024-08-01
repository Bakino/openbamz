const { grafast } = require("grafast");
const graphileConfig = require("./graphileConfig");
const { postgraphile } = require("postgraphile");
const { getConnectionInfo, MAIN_DB_OPTIONS } = require("./init");
const logger = require("../logger");

let pglMain;
function getMainGraphql() {
    if (pglMain) {
        return pglMain;
    }
    pglMain = postgraphile(graphileConfig.mainDbPreset);
    return pglMain;
}

async function runMainGraphql(query, headers) {
    const { schema, resolvedPreset } = await getMainGraphql().getSchemaResult();
    const { data, errors } = await grafast({
        schema,
        resolvedPreset,
        requestContext: {
            node: { req: { headers: headers } }
        },
        source: query,
        variableValues: {},
    });
    if (errors?.length > 0) {
        throw errors;
    }
    return data;
}

async function checkAppAccessMiddleware(req, res, appName, jwtToken) {
    if(!appName){
        appName = req.params.appName ;
    }
    if(!jwtToken){
        jwtToken = req.headers.authorization ;
    }
    try{
        // Check user has proper authorization
        await checkAppAccess(appName, jwtToken) ;
        return true;
    }catch(err){
        res.status(err.statusCode??500).json(err);
        return false;
    }
}
async function checkAppAccess(appName, jwtToken) {
    if(!jwtToken){ throw { statusCode: 401, message: "No token" } ; }
    let result = await runMainGraphql(`query { appByCode(code: "${appName}") { code } }`, { authorization: "Bearer " + jwtToken.replace(/^Bearer/, "").trim() });

    if(result.appByCode?.code === appName){
        return true;
    }
    throw { statusCode: 401, message: "Unauthorized for app "+appName } ;
}

let pglByDb = {};
async function getDbGraphql(appName) {
    if (pglByDb[appName]) {
        return pglByDb[appName];
    }
    let account = await getConnectionInfo(MAIN_DB_OPTIONS, appName);
    if (!account) {
        logger.warn(`No account information for ${appName}`);
        throw `No account information for ${appName}`;
    }
    const options = {
        user: account._id,
        password: account.password,
        superuser: process.env.DB_USER,
        superpassword: process.env.DB_PASSWORD,
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: appName
    };

    pglByDb[appName] = postgraphile(graphileConfig.createAppPreset(options));
    return pglByDb[appName];
}

async function runDbGraphql(appName, query, headers) {
    const { schema, resolvedPreset } = await getDbGraphql(appName).getSchemaResult();
    const { data, errors } = await grafast({
        schema,
        resolvedPreset,
        requestContext: {
            node: { req: { headers: headers } }
        },
        source: query,
        variableValues: {},
    });
    if (errors?.length > 0) {
        throw errors;
    }
    return data;
}

module.exports.getMainGraphql = getMainGraphql;
module.exports.runMainGraphql = runMainGraphql;
module.exports.getDbGraphql = getDbGraphql;
module.exports.runDbGraphql = runDbGraphql;
module.exports.checkAppAccess = checkAppAccess;
module.exports.checkAppAccessMiddleware = checkAppAccessMiddleware;