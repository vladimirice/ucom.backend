"use strict";
const config = require('config');
const connection = config.db_knex.connection_string;
const knex = require('knex')({
    client: 'pg',
    debug: false,
    connection,
});
module.exports = knex;
