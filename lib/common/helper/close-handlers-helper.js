"use strict";
const knex = require("../../../config/knex");
const knexEvents = require("../../../config/knex-events");
const { Client } = require('pg');
const config = require('config');
const _ = require('lodash');
const models = require('../../../models');
class CloseHandlersHelper {
    static async closeDbConnections() {
        this.closeSequelizeAndKnex();
        await this.terminateConnections(config.db_knex_monolith.connection);
        await this.terminateConnections(config.db_knex_events.connection);
    }
    static async closeSequelizeAndKnex() {
        await Promise.all([
            knex.destroy(),
            knexEvents.destroy(),
            models.sequelize.close(),
        ]);
    }
    static async terminateConnections(pgConfigSection) {
        const pgConfig = _.pick(pgConfigSection, ['user', 'host', 'database', 'password']);
        const client = new Client(pgConfig);
        client.connect();
        const sql = `
      SELECT pg_terminate_backend(pg_stat_activity.pid)
        FROM pg_stat_activity
      WHERE pg_stat_activity.datname = 'uos_backend_app' -- ← change this to your DB
        AND pid <> pg_backend_pid();
    `;
        await client.query(sql);
        await client.end();
    }
}
module.exports = CloseHandlersHelper;
