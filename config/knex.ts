const config = require('config');

const connection = config.db_knex.connection_string;

const knex = require('knex')({
  client: 'pg',
  debug: false,
  connection,
});

const bookshelf = require('bookshelf')(knex);

export {
  knex,
  bookshelf,
};
