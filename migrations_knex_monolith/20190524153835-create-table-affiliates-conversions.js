const CONVERSIONS_TABLE_NAME              = 'affiliates.conversions';
const CONVERSIONS_TABLE_NAME_CONSTRAINTS  = 'affiliates_conversions';

exports.up = (knex) => {
  const sql = `
    SELECT setval('migrations_knex_id_seq', MAX(id), true) FROM migrations_knex;

    CREATE TABLE ${CONVERSIONS_TABLE_NAME} 
    (
      id                BIGSERIAL NOT NULL
                        CONSTRAINT ${CONVERSIONS_TABLE_NAME_CONSTRAINTS}_pkey PRIMARY KEY,

      created_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

      offer_id          BIGINT NOT NULL REFERENCES affiliates.offers(id)  ON DELETE RESTRICT,
      stream_id         BIGINT NOT NULL REFERENCES affiliates.streams(id) ON DELETE RESTRICT,
      click_id          BIGINT NOT NULL REFERENCES affiliates.clicks(id)  ON DELETE RESTRICT,
      users_activity_id INT NOT NULL    REFERENCES users_activity(id)     ON DELETE RESTRICT,
      user_id           INT NOT NULL    REFERENCES "Users"(id)            ON DELETE RESTRICT,
      
      status            SMALLINT NOT NULL,

      json_headers      JSONB NOT NULL,
      referer           VARCHAR(1024) NOT NULL
    );

    CREATE INDEX ${CONVERSIONS_TABLE_NAME_CONSTRAINTS}_offer_id_idx             ON ${CONVERSIONS_TABLE_NAME}(offer_id);
    CREATE INDEX ${CONVERSIONS_TABLE_NAME_CONSTRAINTS}_stream_id_idx            ON ${CONVERSIONS_TABLE_NAME}(stream_id);
    CREATE INDEX ${CONVERSIONS_TABLE_NAME_CONSTRAINTS}_click_id_idx             ON ${CONVERSIONS_TABLE_NAME}(click_id);
    CREATE INDEX ${CONVERSIONS_TABLE_NAME_CONSTRAINTS}_users_activity_id_idx    ON ${CONVERSIONS_TABLE_NAME}(users_activity_id);

    ALTER TABLE ${CONVERSIONS_TABLE_NAME} ADD CONSTRAINT ${CONVERSIONS_TABLE_NAME_CONSTRAINTS}_check
      CHECK 
          (
              char_length(referer) > 0
              AND pg_column_size(json_headers) > 0
              AND status IN (1, 2, 3) -- 1 - new, 2 - confirmed, 3 - error
          );
   `;

  return knex.raw(sql);
};

// eslint-disable-next-line
exports.down = function(knex, Promise) {};
