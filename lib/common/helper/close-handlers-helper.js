"use strict";
const knex = require("../../../config/knex");
const knexEvents = require("../../../config/knex-events");
const models = require('../../../models');
class CloseHandlersHelper {
    static async closeDbConnections() {
        await Promise.all([
            knex.destroy(),
            knexEvents.destroy(),
            models.sequelize.close(),
        ]);
    }
}
module.exports = CloseHandlersHelper;
