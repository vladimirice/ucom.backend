exports.up = (knex) => {
  const sql = `
      SELECT setval('migrations_knex_id_seq', MAX(id), true) FROM migrations_knex;
      
      INSERT INTO accounts_symbols (id, title, precision) VALUES (1, 'UOS', 4);
      INSERT INTO accounts_symbols (id, title, precision) VALUES (2, 'UOSTEST', 4);
      INSERT INTO accounts_symbols (id, title, precision)
      VALUES (3, 'GHTEST', 4);
  `;

  return knex.raw(sql);
};

// eslint-disable-next-line
exports.down = function (knex, Promise) {
};
