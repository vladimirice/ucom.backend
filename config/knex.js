"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config = require('config');
const connection = config.db_knex.connection_string;
const knex = require('knex')({
    client: 'pg',
    debug: false,
    connection,
});
exports.knex = knex;
const bookshelf = require('bookshelf')(knex);
exports.bookshelf = bookshelf;
