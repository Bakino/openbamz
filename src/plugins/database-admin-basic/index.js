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


const express = require("express");
const path = require("path");

module.exports.initPlugin = async ({app})=>{
    app.use("/plugin/database-admin-basic/", express.static(path.join(__dirname, "html") ));

}