const TABLE_NAME = 'posts';

exports.up = (knex) => {
  const sql = `
    SELECT setval('migrations_knex_id_seq', MAX(id), true) FROM migrations_knex;

      UPDATE ${TABLE_NAME} 
      SET entity_images = '{}'
          WHERE
              entity_images = '"null"'
          OR  entity_images IS NULL
          OR  entity_images = '"{}"'
          OR  entity_images = '""';

    ALTER TABLE ${TABLE_NAME} ALTER COLUMN entity_images SET NOT NULL;
`;

  return knex.raw(sql);
};

// eslint-disable-next-line no-unused-vars
exports.down = (knex, Promise) => {};
