const { PostGraphileAmberPreset } = require("postgraphile/presets/amber");
const { PgLazyJWTPreset } = require("postgraphile/presets/lazy-jwt");
//const { defaultMaskError } = require("postgraphile/grafserv");


const { makePgService } = require("postgraphile/adaptors/pg");

//Configuration for the main database
const mainDbPreset = {
    extends: [PostGraphileAmberPreset, PgLazyJWTPreset],
    pgServices: [makePgService({ 
        connectionString: `postgres://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
        schemas: ["public"],
    })],
    gather: {
        pgJwtTypes: "public.jwt_token",
    },
    grafserv: { 
        watch: true,
        graphqlPath: `/graphql/${process.env.DB_NAME}`,
        graphiqlPath: `/graphiql/${process.env.DB_NAME}`,
        eventStreamPath: `/graphql/${process.env.DB_NAME}/stream`,
    },
    schema: {
        pgJwtSecret: process.env.JWT_SECRET,
    },
    grafast: {
        context(requestContext, args) {
          return {
            pgSettings: {
              role: "anonymous",
              // JWT may override the role:
              ...args.contextValue?.pgSettings,
            },
          };
        },
    },
};

// Create configuration for app database
function createAppPreset(options){
    return {
        extends: [PostGraphileAmberPreset, PgLazyJWTPreset],
        pgServices: [makePgService({ 
            //connectionString: `postgres://${options.user}:${options.password}@${options.host}:${options.port}/${options.database}`,
            //connection must be done with super user because database user does not have to switch to role of secondary admin that are not db owner
            connectionString: `postgres://${options.superuser}:${options.superpassword}@${options.host}:${options.port}/${options.database}`,
            superuserConnectionString: `postgres://${options.superuser}:${options.superpassword}@${options.host}:${options.port}/${options.database}`,
            schemas: ["public", "openbamz"],
        })],
        grafserv: { 
            watch: true,
            graphqlPath: `/graphql/${options.database}`,
            graphiqlPath: `/graphiql/${options.database}`,
            eventStreamPath: `/graphql/${options.database}/stream`,
            maskError(error) {
              //const masked = defaultMaskError(error);
              //don't mask error to help admin fix there bug
              //TODO: should it be done depending on user ? or create hash and save it in private log table ? 
              return error;
            },
        },
        schema: {
            pgJwtSecret: process.env.JWT_SECRET,
        },
        grafast: {
            context(requestContext, args) {
              return {
                pgSettings: {
                  role: "anonymous",
                  // JWT may override the role:
                  ...args.contextValue?.pgSettings,
                },
              };
            },
        },
    };
}

module.exports.mainDbPreset = mainDbPreset;
module.exports.createAppPreset = createAppPreset;
