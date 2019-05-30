const CLICKS              = 'affiliates.clicks';
const CLICKS_CONSTRAINTS  = 'affiliates_clicks';

exports.up = (knex) => {
  const sql = `
    SELECT setval('migrations_knex_id_seq', MAX(id), true) FROM migrations_knex;

    CREATE TABLE ${CLICKS}
    (
      id              BIGSERIAL NOT NULL
                      CONSTRAINT ${CLICKS_CONSTRAINTS}_pkey PRIMARY KEY,
      offer_id        BIGINT NOT NULL REFERENCES affiliates.offers(id) ON DELETE RESTRICT,
      stream_id       BIGINT NOT NULL REFERENCES affiliates.streams(id) ON DELETE RESTRICT,

      user_unique_id  VARCHAR(255) NOT NULL, 
      referer         VARCHAR(1024) NOT NULL,
      
      json_headers    JSONB NOT NULL,
      created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
    );

    CREATE INDEX ${CLICKS_CONSTRAINTS}_offer_id_idx ON ${CLICKS}(offer_id);
    CREATE INDEX ${CLICKS_CONSTRAINTS}_stream_id_idx ON ${CLICKS}(stream_id);

      ALTER TABLE ${CLICKS} ADD CONSTRAINT ${CLICKS_CONSTRAINTS}_check
        CHECK 
            (
              char_length(user_unique_id) > 0
              AND pg_column_size(json_headers) > 0
            );
   `;

  return knex.raw(sql);
};

// eslint-disable-next-line
exports.down = function(knex, Promise) {};
