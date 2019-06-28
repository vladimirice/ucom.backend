const TABLE_NAME = 'airdrops_users_github_raw_round_two';

const TABLE_NAME_WITH_SCHEMA = TABLE_NAME;
const TABLE_NAME_FOR_CONSTRAINTS = TABLE_NAME;

exports.up = (knex) => {
  const sql = `
      SELECT setval('migrations_knex_id_seq', MAX(id), true) FROM migrations_knex;

      CREATE TABLE ${TABLE_NAME}
      (
        id BIGINT NOT NULL CONSTRAINT ${TABLE_NAME_FOR_CONSTRAINTS}_pk
                           PRIMARY KEY,
        score NUMERIC (20, 10),
        amount BIGINT NOT NULL
      );

      ALTER TABLE ${TABLE_NAME_WITH_SCHEMA} 
          ADD CONSTRAINT ${TABLE_NAME_FOR_CONSTRAINTS}_check_id 
      CHECK (id > 0);

      ALTER TABLE ${TABLE_NAME_WITH_SCHEMA} 
          ADD CONSTRAINT ${TABLE_NAME_FOR_CONSTRAINTS}_check_score
      CHECK (score >= 0);

      ALTER TABLE ${TABLE_NAME_WITH_SCHEMA} 
          ADD CONSTRAINT ${TABLE_NAME_FOR_CONSTRAINTS}_check_amount
      CHECK (amount >= 0);
  `;

  return knex.raw(sql);
};

// eslint-disable-next-line no-unused-vars,func-names
exports.down = function (knex, Promise) {
};
