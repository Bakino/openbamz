module.exports.prepareDatabase = async ({client})=>{
    await client.query(`create or replace function public.run_query(
  query text
)
returns JSON as
$$
    let result = plv8.execute(query);
    return result;
$$
LANGUAGE "plv8"`) ;
}

module.exports.cleanDatabase = async ({client})=>{
    await client.query(`drop function if exists public.run_query`) ;
}


module.exports.initPlugin = async ()=>{
    //add link to top menu
    return {
        // path in which the plugin provide its front end files
        frontEndPath: "html",
        menu: [
            { name: "admin", entries: [
                { name: "Database admin", link: "/plugin/:appName/database-admin-basic/" }
            ]}
        ]
    }
}