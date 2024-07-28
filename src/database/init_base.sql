CREATE EXTENSION  IF NOT EXISTS  plv8;
CREATE EXTENSION  IF NOT EXISTS  pgcrypto;
CREATE EXTENSION  IF NOT EXISTS  http;

-- create schema openbamz
CREATE SCHEMA IF NOT EXISTS openbamz;

-- Create plugins table
CREATE TABLE IF NOT EXISTS openbamz.plugins (
    plugin_id varchar(128) primary key,
    create_time timestamp without time zone DEFAULT now()
) ;

-- trigger, on insert plugin, prepare the plugin
CREATE OR REPLACE FUNCTION openbamz_plugin_insert() RETURNS TRIGGER AS
$$
    plv8.execute(`SELECT graphile_worker.add_job('addPlugin', json_build_object('plugin', '${NEW.plugin_id}'))`);
$$
LANGUAGE "plv8" SECURITY DEFINER;

CREATE OR REPLACE TRIGGER openbamz_plugin_insert
    AFTER INSERT
    ON openbamz.plugins FOR EACH ROW
    EXECUTE PROCEDURE openbamz_plugin_insert();


-- trigger, on insert plugin, prepare the plugin
CREATE OR REPLACE FUNCTION openbamz_plugin_remove() RETURNS TRIGGER AS
$$
    plv8.execute(`SELECT graphile_worker.add_job('removePlugin', json_build_object('plugin', '${OLD.plugin_id}'))`);
$$
LANGUAGE "plv8" SECURITY DEFINER;

CREATE OR REPLACE TRIGGER openbamz_plugin_remove
    AFTER DELETE
    ON openbamz.plugins FOR EACH ROW
    EXECUTE PROCEDURE openbamz_plugin_remove();
