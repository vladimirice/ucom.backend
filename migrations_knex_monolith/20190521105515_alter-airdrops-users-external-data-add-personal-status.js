const TABLE_NAME = 'airdrops_users_external_data';

exports.up = (knex) => {
  const sql = `
      SELECT setval('migrations_knex_id_seq', MAX(id), true) FROM migrations_knex;

      ALTER TABLE "${TABLE_NAME}" ADD COLUMN personal_statuses SMALLINT[] NOT NULL DEFAULT '{2}';

      ALTER TABLE ${TABLE_NAME} 
          ADD CONSTRAINT ${TABLE_NAME}_personal_status_check
      CHECK (
          array_length(personal_statuses, 1) IS NOT NULL
          AND array_length(personal_statuses, 1) > 0
          AND 0 <> ALL(personal_statuses)
      );
   `;

  return knex.raw(sql);
};

// eslint-disable-next-line
exports.down = function(knex, Promise) {};
