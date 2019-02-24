exports.up = (knex) => {
  const sql = `
    SELECT setval('migrations_knex_id_seq', MAX(id), true) FROM migrations_knex;

    ALTER TABLE entity_event_param RENAME TO entity_event_param_old_backup;
    `;

  return knex.raw(sql);
};

// eslint-disable-next-line
exports.down = function(knex, Promise) {};
