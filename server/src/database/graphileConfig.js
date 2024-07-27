const { PostGraphileAmberPreset } = require("postgraphile/presets/amber");
const { PgLazyJWTPreset } = require("postgraphile/presets/lazy-jwt");

const { makePgService } = require("postgraphile/adaptors/pg");

//Configuration for the main database
const mainDbPreset = {
    extends: [PostGraphileAmberPreset, PgLazyJWTPreset],
    pgServices: [makePgService({ 
        connectionString: `postgres://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
        schemas: ["public", "private"],
    })],
    gather: {
        pgJwtTypes: "public.jwt_token",
    },
    grafserv: { 
        watch: true,
        graphqlPath: `/graphql/${process.env.DB_NAME}`,
        graphiqlPath: `/graphiql/${process.env.DB_NAME}`,
        eventStreamPath: `/graphql/${process.env.DB_NAME}/stream`
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
            connectionString: `postgres://${options.user}:${options.password}@${options.host}:${options.port}/${options.database}`,
            superuserConnectionString: `postgres://${options.superuser}:${options.superpassword}@${options.host}:${options.port}/${options.database}`,
            schemas: ["public"],
        })],
        grafserv: { 
            watch: true,
            graphqlPath: `/graphql/${options.database}`,
            graphiqlPath: `/graphiql/${options.database}`,
            eventStreamPath: `/graphql/${options.database}/stream`,
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
