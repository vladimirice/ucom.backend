const NEW_COLUMN = 'entity_images';

exports.up = (knex) => {
  const sql = `
    SELECT setval('migrations_knex_id_seq', MAX(id), true) FROM migrations_knex;

    ALTER TABLE "Users" ADD COLUMN profile_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
    ALTER TABLE "Users" ADD COLUMN profile_updated_by SMALLINT NOT NULL DEFAULT 1;

    ALTER TABLE "Users" 
      ADD CONSTRAINT users_profile_updated_by_check
    CHECK (
      profile_updated_by IN (1, 2)
    );
  `;

  return knex.raw(sql);
};

// eslint-disable-next-line no-unused-vars
exports.down = (knex, Promise) => {};
