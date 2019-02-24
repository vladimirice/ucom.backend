const eventsConfig = require('config').db_knex_events;
const monolithConfig = require('config').db_knex_monolith;

module.exports = {
  events: eventsConfig,
  monolith: monolithConfig,
};
