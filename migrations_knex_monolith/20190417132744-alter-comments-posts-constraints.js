exports.up = (knex) => {
  const sql = `
    SELECT setval('migrations_knex_id_seq', MAX(id), true) FROM migrations_knex;

    ALTER TABLE posts ADD CONSTRAINT posts_entity_images_check
    CHECK (
            pg_column_size(entity_images) > 0
            AND pg_column_size(entity_images) < 10000
            AND entity_images != '"{}"'
            AND entity_images != '""'
            AND entity_images != '"null"'
    );

    UPDATE comments
    SET entity_images = '{}'
    WHERE
        entity_images = '"null"'
       OR  entity_images IS NULL
       OR  entity_images = '"{}"'
       OR  entity_images = '""';

    ALTER TABLE comments ALTER COLUMN entity_images DROP DEFAULT;
    ALTER TABLE comments ADD CONSTRAINT comments_entity_images_check
        CHECK (
                pg_column_size(entity_images) > 0
                AND pg_column_size(entity_images) < 10000
                AND entity_images != '"{}"'
                AND entity_images != '""'
                AND entity_images != '"null"'
            );
  `;

  return knex.raw(sql);
};

// eslint-disable-next-line no-unused-vars
exports.down = (knex, Promise) => {};
