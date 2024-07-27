const { deleteAppDirectory } = require("../init");

module.exports = async (payload, {logger, query}) => {
    logger.info(`Received ${JSON.stringify(payload)}`);
    await query(`DROP DATABASE IF EXISTS ${payload.database} WITH (FORCE)`)

    await deleteAppDirectory(payload);
};