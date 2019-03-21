const ACCOUNTS_SYMBOLS = 'accounts_symbols';
const ACCOUNTS = 'accounts';

const AIRDROPS = 'airdrops';
const AIRDROPS_TOKENS = 'airdrops_tokens';
const AIRDROPS_USERS = 'airdrops_users';

const ACCOUNTS_TRANSACTIONS_PARTS = 'accounts_transactions_parts';
const ACCOUNTS_TRANSACTIONS = 'accounts_transactions';

exports.up = (knex) => {
  const sql = `
      SELECT setval('migrations_knex_id_seq', MAX(id), true) FROM migrations_knex;
      
      CREATE TABLE ${ACCOUNTS_SYMBOLS}
      (
        id                    BIGINT NOT NULL
                              CONSTRAINT ${ACCOUNTS_SYMBOLS}_pkey PRIMARY KEY,
        
        title                 VARCHAR(100) NOT NULL UNIQUE CHECK(char_length(title) > 0),
        precision             SMALLINT NOT NULL CHECK (precision >= 1),
        
        created_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );

      CREATE INDEX ${ACCOUNTS_SYMBOLS}_title_idx ON ${ACCOUNTS_SYMBOLS}(title);

      CREATE TABLE ${ACCOUNTS_TRANSACTIONS}
      (        
        id              BIGSERIAL NOT NULL
                        CONSTRAINT ${ACCOUNTS_TRANSACTIONS}_pkey PRIMARY KEY,

        created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,       
        parent_id       BIGINT DEFAULT NULL REFERENCES ${ACCOUNTS_TRANSACTIONS}(id) ON DELETE RESTRICT,
        json_data       JSONB NOT NULL DEFAULT '{}'        
      );

      CREATE INDEX ${ACCOUNTS_TRANSACTIONS}_parent_id_idx ON ${ACCOUNTS_TRANSACTIONS}(parent_id);

      CREATE TABLE ${ACCOUNTS}
      (        
        id                    BIGSERIAL NOT NULL
                              CONSTRAINT ${ACCOUNTS}_pkey PRIMARY KEY,
                              
        created_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,       
        updated_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,       
        
        account_type          SMALLINT NOT NULL CHECK (account_type >= 0),
        
        user_id               INT NULL REFERENCES "Users"(id) ON DELETE RESTRICT,
        symbol_id             SMALLINT NOT NULL REFERENCES ${ACCOUNTS_SYMBOLS}(id) ON DELETE RESTRICT,
        current_balance       BIGINT NOT NULL DEFAULT 0,

        last_transaction_id   BIGINT DEFAULT NULL REFERENCES ${ACCOUNTS_TRANSACTIONS}(id) ON DELETE RESTRICT, 
        
        CONSTRAINT ${ACCOUNTS}_user_id_disallow_null_check 
        CHECK (
          ( account_type IN (1, 2) AND user_id IS NULL) 
          OR ( account_type NOT IN (1, 2) AND user_id IS NOT NULL)
        ) 
      );

      CREATE INDEX ${ACCOUNTS}_user_id_idx ON ${ACCOUNTS}(user_id);
      CREATE INDEX ${ACCOUNTS}_symbol_id_idx ON ${ACCOUNTS}(symbol_id);

      CREATE TABLE ${AIRDROPS}
      (
        id              BIGSERIAL NOT NULL
                        CONSTRAINT ${AIRDROPS}_pkey PRIMARY KEY,
                              
        created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,       
        updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,       

        started_at       TIMESTAMP WITH TIME ZONE NOT NULL,       
        finished_at      TIMESTAMP WITH TIME ZONE NOT NULL,       
        
        title           VARCHAR(255) NOT NULL CHECK(char_length(title) > 0),
        status          SMALLINT NOT NULL CHECK (status > 0),
        
        post_id         INT NOT NULL UNIQUE REFERENCES posts(id) ON DELETE RESTRICT,
        conditions      JSONB NOT NULL
      );

      CREATE INDEX ${AIRDROPS}_post_id_idx ON ${AIRDROPS}(post_id);

      CREATE TABLE ${AIRDROPS_TOKENS}
      (        
        id              BIGSERIAL NOT NULL
                        CONSTRAINT ${AIRDROPS_TOKENS}_pkey PRIMARY KEY,
                              
        created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,       
        updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
                
        airdrop_id        BIGINT NOT NULL REFERENCES ${AIRDROPS}(id) ON DELETE RESTRICT,
        
        debt_account_id   BIGINT NOT NULL REFERENCES ${ACCOUNTS}(id) ON DELETE RESTRICT,
        income_account_id BIGINT NOT NULL REFERENCES ${ACCOUNTS}(id) ON DELETE RESTRICT,
        
        status            SMALLINT NOT NULL CHECK (status > 0)
      );

      CREATE INDEX ${AIRDROPS_TOKENS}_airdrop_id_idx ON ${AIRDROPS_TOKENS}(airdrop_id);

      CREATE INDEX ${AIRDROPS_TOKENS}_debt_account_id_idx ON ${AIRDROPS_TOKENS}(debt_account_id);
      CREATE INDEX ${AIRDROPS_TOKENS}_income_account_id_idx ON ${AIRDROPS_TOKENS}(income_account_id);

      CREATE TABLE ${AIRDROPS_USERS}
      (        
        id              BIGSERIAL NOT NULL
                        CONSTRAINT ${AIRDROPS_USERS}_pkey PRIMARY KEY,
                              
        created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,       
        updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        
        user_id             INT NOT NULL REFERENCES "Users"(id) ON DELETE RESTRICT,
                
        airdrop_id          BIGINT NOT NULL REFERENCES ${AIRDROPS}(id) ON DELETE RESTRICT,
        
        reserved_account_id BIGINT NOT NULL REFERENCES ${ACCOUNTS}(id) ON DELETE RESTRICT,
        waiting_account_id  BIGINT NOT NULL REFERENCES ${ACCOUNTS}(id) ON DELETE RESTRICT,
        wallet_account_id   BIGINT NOT NULL REFERENCES ${ACCOUNTS}(id) ON DELETE RESTRICT,
        
        status              SMALLINT NOT NULL CHECK (status > 0),
        score               NUMERIC(30, 10) NOT NULL DEFAULT 0 CHECK (status >= 0)
      );

      CREATE INDEX ${AIRDROPS_USERS}_airdrop_id_idx ON ${AIRDROPS_USERS}(airdrop_id);

      CREATE UNIQUE INDEX ${AIRDROPS_USERS}_reserved_account_id_idx ON ${AIRDROPS_USERS}(reserved_account_id);
      CREATE UNIQUE INDEX ${AIRDROPS_USERS}_waiting_account_id_idx ON ${AIRDROPS_USERS}(waiting_account_id);
      CREATE UNIQUE INDEX ${AIRDROPS_USERS}_wallet_account_id_idx ON ${AIRDROPS_USERS}(wallet_account_id);

      CREATE TABLE ${ACCOUNTS_TRANSACTIONS_PARTS}
      (        
        id              BIGSERIAL NOT NULL
                        CONSTRAINT ${ACCOUNTS_TRANSACTIONS_PARTS}_pkey PRIMARY KEY,
                        
        transaction_id  BIGINT NOT NULL REFERENCES ${ACCOUNTS_TRANSACTIONS}(id) ON DELETE RESTRICT,
        account_id      BIGINT NOT NULL REFERENCES ${ACCOUNTS}(id) ON DELETE RESTRICT,
        
        amount          BIGINT NOT NULL
      );

      CREATE INDEX ${ACCOUNTS_TRANSACTIONS_PARTS}_transaction_idx 
        ON ${ACCOUNTS_TRANSACTIONS_PARTS}(transaction_id);

      CREATE INDEX ${ACCOUNTS_TRANSACTIONS_PARTS}_account_id_idx 
        ON ${ACCOUNTS_TRANSACTIONS_PARTS}(account_id);
`;

  return knex.raw(sql);
};

// eslint-disable-next-line
exports.down = function (knex, Promise) {
};
