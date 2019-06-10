import { Model } from 'objection';

const config = require('config').db_knex_monolith;
const knex = require('knex')(config);

Model.knex(knex);

export = knex;
