const STREAMS             = 'affiliates.streams';
const STREAMS_CONSTRAINTS = 'affiliates_streams';

exports.up = (knex) => {
  const sql = `
    SELECT setval('migrations_knex_id_seq', MAX(id), true) FROM migrations_knex;

    CREATE TABLE ${STREAMS}
    (
        id              BIGSERIAL                          NOT NULL
                        CONSTRAINT ${STREAMS_CONSTRAINTS}_pkey PRIMARY KEY,

        user_id         INT             NOT NULL REFERENCES "Users" (id)           ON DELETE RESTRICT,
        account_name    VARCHAR(255)    NOT NULL REFERENCES "Users" (account_name) ON DELETE RESTRICT,

        offer_id        BIGINT          NOT NULL REFERENCES affiliates.offers(id)  ON DELETE RESTRICT,

        created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
    );  
            
    CREATE INDEX ${STREAMS_CONSTRAINTS}_user_id_idx      ON ${STREAMS}(user_id);
    CREATE INDEX ${STREAMS_CONSTRAINTS}_account_name_idx ON ${STREAMS}(account_name);
    CREATE INDEX ${STREAMS_CONSTRAINTS}_offer_id_idx     ON ${STREAMS}(offer_id);

    ALTER TABLE ${STREAMS} ADD CONSTRAINT ${STREAMS_CONSTRAINTS}_check
        CHECK (created_at <= updated_at);
   `;

  return knex.raw(sql);
};

// eslint-disable-next-line
exports.down = function(knex, Promise) {};
