const TABLE_NAME = 'entity_event_param';

exports.up = (knex) => {
  const sql = `
      SELECT setval('migrations_knex_id_seq', MAX(id), true) FROM migrations_knex;
      
      CREATE INDEX ${TABLE_NAME}_event_type_created_at_idx ON ${TABLE_NAME}(event_type, created_at DESC)  
    `;

  return knex.raw(sql);
};

// eslint-disable-next-line
exports.down = function(knex, Promise) {};
