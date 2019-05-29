const OFFERS              = 'affiliates.offers';
const OFFERS_CONSTRAINTS  = 'affiliates_offers';

exports.up = (knex) => {
  const sql = `
    SELECT setval('migrations_knex_id_seq', MAX(id), true) FROM migrations_knex;

    CREATE SCHEMA affiliates;

    CREATE TABLE ${OFFERS}
      (
        id                      BIGSERIAL NOT NULL
                                CONSTRAINT ${OFFERS_CONSTRAINTS}_pkey PRIMARY KEY,

        created_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

        started_at              TIMESTAMP WITH TIME ZONE NOT NULL,
        finished_at             TIMESTAMP WITH TIME ZONE DEFAULT NULL, -- if NULL then there is no end date

        post_id                 INT NOT NULL REFERENCES posts(id) ON DELETE RESTRICT,

        status                  SMALLINT NOT NULL,

        title                   VARCHAR(255) NOT NULL,

        attribution_id          SMALLINT NOT NULL,
        event_id                SMALLINT NOT NULL,
        participation_id        SMALLINT NOT NULL,

        url_template            VARCHAR(255) NOT NULL, 
        hash                    VARCHAR(255) NOT NULL 
      );

      CREATE UNIQUE INDEX ${OFFERS_CONSTRAINTS}_post_id_unique_idx ON ${OFFERS}(post_id);
      CREATE UNIQUE INDEX ${OFFERS_CONSTRAINTS}_hash_unique_idx ON ${OFFERS}(hash);

      ALTER TABLE ${OFFERS} ADD CONSTRAINT ${OFFERS_CONSTRAINTS}_check
          CHECK (
                  char_length(title) > 0
                  AND created_at <= updated_at
                  AND started_at < finished_at
                  AND status > 0
                  AND char_length(url_template) > 0 -- # {domain}/registration/?{query_string}
                  AND char_length(hash) > 0
                  AND event_id = 130
                  AND attribution_id IN (1, 2) -- 1 - first referrer wins, 2 - last referrer wins
                  AND participation_id = 1 -- all registered
              );
   `;

  return knex.raw(sql);
};

// eslint-disable-next-line
exports.down = function(knex, Promise) {};
