
----- activate extensions ------
--------------------------------

-- PLv8 extension, to write function in javascript
CREATE EXTENSION  IF NOT EXISTS  plv8;

-- PG CRYPTO  extension
CREATE EXTENSION  IF NOT EXISTS  pgcrypto;


----- schemas  ------
---------------------

-- create schema private
CREATE SCHEMA IF NOT EXISTS private;


----- account management -------
--------------------------------

-- Create account table
CREATE TABLE IF NOT EXISTS private.account (
    _id uuid primary key DEFAULT gen_random_uuid(),
    create_time timestamp without time zone DEFAULT now(),
    email varchar(512) UNIQUE,
    name varchar(128),
    role varchar(128),
    password varchar(512),
    password_hash varchar(512)
) ;

-- trigger on create account, create the database user and crypt login password
CREATE OR REPLACE FUNCTION account_create_user() RETURNS TRIGGER AS
$$
    //generate the password for database user
    let result = plv8.execute(`SELECT gen_random_uuid() as uuidpass`);
    plv8.execute(`CREATE USER "${NEW._id}"  WITH PASSWORD '${result[0].uuidpass}'`);
    let dbpass = result[0].uuidpass ;

    //grant the role to the database user
    plv8.execute(`GRANT "${NEW.role}" TO "${NEW._id}"`)

    //crypt the password
    result = plv8.execute(`SELECT crypt($1, gen_salt('md5')) as crypted`, [NEW.password]);
    NEW.password_hash = result[0].crypted ;
    NEW.password = dbpass ;

    return NEW;
$$
LANGUAGE "plv8";

CREATE OR REPLACE TRIGGER account_create_user
    BEFORE INSERT
    ON private.account FOR EACH ROW
    EXECUTE PROCEDURE account_create_user();


-- trigger on delete account, drop the database user
CREATE OR REPLACE FUNCTION account_drop_user() RETURNS TRIGGER AS
$$
    plv8.execute(`DROP USER "${OLD._id}"`);
$$
LANGUAGE "plv8";

CREATE OR REPLACE TRIGGER account_drop_user
    AFTER DELETE
    ON private.account FOR EACH ROW
    EXECUTE PROCEDURE account_drop_user();


------- JWT auth system --------
--------------------------------

-- Prepare JWT token type
DROP TYPE IF EXISTS public.jwt_token CASCADE;
create type public.jwt_token as (
  role varchar,
  exp integer,
  id uuid,
  email varchar
);

-- function authenticate
create or replace function public.authenticate(
  email text,
  password text
)
returns public.jwt_token
as $$
declare
  account private.account;
begin
  select a.* into account
    from private.account as a
    where a.email = authenticate.email;

  if account.password_hash = crypt(password, account.password_hash) then
    return (
      account._id,
      extract(epoch from now() + interval '7 days'),
      account._id,
      account.email
    )::public.jwt_token;
  else
    return null;
  end if;
end;
$$ language plpgsql strict security definer;

-- function authenticate
create or replace function public.create_account(
  email text,
  name text,
  password text
)
returns private.account
as $$
DECLARE
   result private.account;
begin
  insert into private.account(email, name, password, role) values (email, name, password, 'normal_user') returning * INTO result;
  result.password = '';
  result.password_hash = '';
  return result;
end;
$$ language plpgsql strict security definer;

create or replace function public.delete_account(
  email text
)
returns void as
$$

    let result = plv8.execute(`SELECT * FROM private.account WHERE email = $1`, [email]);
    let account = result[0]
    if(!account){
      throw "Unkown account "+email ;
    }
    let resultRole = plv8.execute(`SELECT current_setting('role') as role`);
    if(resultRole[0] !== account._id){
      throw "Only owner of account can delete it" ;
    }
    
    plv8.execute(`DELETE FROM private.account WHERE _id = $1`, [account._id]);

    return NEW;
$$
LANGUAGE "plv8" SECURITY DEFINER;


------- Application management --------
---------------------------------------

CREATE TABLE IF NOT EXISTS public.app(
  code VARCHAR(64) PRIMARY KEY,
  name VARCHAR(64),
  owner UUID,
  admins JSONB NOT NULL DEFAULT '[]'::jsonb, -- [ { _id, email, name }, ... ]
  FOREIGN KEY(owner) 
       REFERENCES private.account(_id)
       ON DELETE CASCADE
) ;

-- check user right
alter table public.app enable row level security;

DROP POLICY  IF EXISTS  select_app ON public.app;
DROP POLICY  IF EXISTS  update_app ON public.app;
DROP POLICY  IF EXISTS  delete_app ON public.app;
DROP POLICY  IF EXISTS  insert_app ON public.app;

-- owner and admins can read the record
create policy select_app on public.app for select to normal_user
  using (owner::varchar = nullif(current_setting('role', true), '') OR admins @> ('[{"_id":"'||nullif(current_setting('role', true), '')||'"}]')::jsonb);
-- only owner can update
create policy update_app on public.app for update to normal_user
  using (owner::varchar = nullif(current_setting('role', true), ''));
-- only owner can delete
create policy delete_app on public.app for delete to normal_user
  using (owner::varchar = nullif(current_setting('role', true), ''));
create policy insert_app on public.app for insert to normal_user
  with check (true); -- no check because the trigger force the owner to current user


-- trigger, on create application, create the database
CREATE OR REPLACE FUNCTION app_create_database() RETURNS TRIGGER AS
$$

    let result = plv8.execute(`SELECT current_setting('role') as role`);
    NEW.owner = result[0].role ; // force owner to current user

    plv8.execute(`SELECT graphile_worker.add_job('createDatabase', json_build_object('database', '${NEW.code}'))`);

    return NEW;
$$
LANGUAGE "plv8" SECURITY DEFINER;

CREATE OR REPLACE TRIGGER app_create_database
    BEFORE INSERT
    ON app FOR EACH ROW
    EXECUTE PROCEDURE app_create_database();


-- trigger, on create or update application, update admins ids
CREATE OR REPLACE FUNCTION app_update_admins() RETURNS TRIGGER AS
$$

    for(let admin of NEW.admins){
      let results = plv8.execute("SELECT _id, name FROM private.account WHERE email = $1", [admin.email]) ;
      if(results[0]){
        admin._id = results[0]._id;
        admin.name = results[0].name;
      }else{
        delete admin._id;
      }
    }

    NEW.admins = NEW.admins.filter(a=>a._id) ;
    

    return NEW;
$$
LANGUAGE "plv8" SECURITY DEFINER;

CREATE OR REPLACE TRIGGER app_update_admins
    BEFORE INSERT OR UPDATE
    ON app FOR EACH ROW
    EXECUTE PROCEDURE app_update_admins();



-- trigger, on create or update application, update permissions
CREATE OR REPLACE FUNCTION app_update_permissions() RETURNS TRIGGER AS
$$

    let previousAdminIds = [];
    if(OLD){
      previousAdminIds = OLD.admins.map(a=>a._id) ;
    }
    let newAdminsIds = NEW.admins.map(a=>a._id) ;

    let adminToRemove = previousAdminIds.filter(a=>!newAdminsIds.includes(a));
    let adminToAdd = newAdminsIds.filter(a=>!previousAdminIds.includes(a));

    let dbRole = NEW.code+"_admin";
    for(let admin of adminToRemove){
      plv8.execute(`REVOKE "${dbRole}" FROM "${admin}"`);
    }
    for(let admin of adminToAdd){
      plv8.execute(`GRANT "${dbRole}" TO "${admin}"`);
    }

    return NEW;
$$
LANGUAGE "plv8" SECURITY DEFINER;

CREATE OR REPLACE TRIGGER app_update_permissions
    AFTER INSERT OR UPDATE
    ON app FOR EACH ROW
    EXECUTE PROCEDURE app_update_permissions();


-- trigger, on delete application, delete the database
CREATE OR REPLACE FUNCTION app_drop_database() RETURNS TRIGGER AS
$$
    plv8.execute(`SELECT graphile_worker.add_job('dropDatabase', json_build_object('database', '${OLD.code}'))`);

    plv8.elog(NOTICE, "database deleted");
$$
LANGUAGE "plv8";

CREATE OR REPLACE TRIGGER app_drop_database
    AFTER DELETE
    ON app FOR EACH ROW
    EXECUTE PROCEDURE app_drop_database();



