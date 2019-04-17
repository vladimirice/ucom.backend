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

    ALTER TABLE ${TABLE_NAME} ADD CONSTRAINT ${TABLE_NAME}_entity_images_max_length 
      CHECK (pg_column_size(entity_images) > 0 AND pg_column_size(entity_images) < 10000);

    ALTER TABLE comments ALTER COLUMN entity_images DROP DEFAULT;
    ALTER TABLE comments ADD CONSTRAINT comments_entity_images_max_length 
      CHECK (pg_column_size(entity_images) > 0 AND pg_column_size(entity_images) < 10000);
`;

  return knex.raw(sql);
};

// eslint-disable-next-line no-unused-vars
exports.down = (knex, Promise) => {};
