"use strict";
const objection_1 = require("objection");
const config = require('config').db_knex_monolith;
const knex = require('knex')(config);
objection_1.Model.knex(knex);
module.exports = knex;
