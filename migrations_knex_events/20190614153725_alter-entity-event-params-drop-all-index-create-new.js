const TABLE_NAME = 'entity_event_param';

exports.up = (knex) => {
  const sql = `
      SELECT setval('migrations_knex_id_seq', MAX(id), true) FROM migrations_knex;

      CREATE INDEX entity_event_param_event_type_entity_name_created_at_idx ON entity_event_param(event_type, entity_name, created_at DESC);
      DROP INDEX entity_event_param_event_type_created_at_idx;
    `;

  return knex.raw(sql);
};

// eslint-disable-next-line
exports.down = function(knex, Promise) {};
