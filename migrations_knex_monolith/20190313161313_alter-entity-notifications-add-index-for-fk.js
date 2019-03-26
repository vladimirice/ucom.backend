exports.up = (knex) => {
  const sql = `
    SELECT setval('migrations_knex_id_seq', MAX(id), true) FROM migrations_knex;
    CREATE INDEX entity_notifications_users_activity_id_idx ON entity_notifications(users_activity_id);
`;

  return knex.raw(sql);
};

// eslint-disable-next-line
exports.down = function(knex, Promise) {};
