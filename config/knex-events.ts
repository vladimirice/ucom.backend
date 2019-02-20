const config = require('config').db_knex_events;
const knexEvents = require('knex')(config);

export = knexEvents;
