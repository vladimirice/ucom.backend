"use strict";
const config = require('config').db_knex_monolith;
const knex = require('knex')(config);
module.exports = knex;
