const TABLE_NAME = 'blockchain_tr_traces';

module.exports = {
  up: (queryInterface) => {
    const sql = `
      CREATE TABLE ${TABLE_NAME}
      (
        id                    BIGSERIAL NOT NULL
                              CONSTRAINT ${TABLE_NAME}_pkey PRIMARY KEY,
                              
        tr_type               SMALLINT NOT NULL,
        tr_processed_data     JSONB NOT NULL,
        
        memo                  VARCHAR(2048) NOT NULL DEFAULT '',
        tr_id                 VARCHAR(1024) NOT NULL UNIQUE,
        external_id           VARCHAR(1024) NOT NULL UNIQUE,             
        
        account_name_from     VARCHAR(255) DEFAULT NULL,
        account_name_to       VARCHAR(255) DEFAULT NULL,
          
        raw_tr_data           JSONB NOT NULL,
        
        tr_executed_at        TIMESTAMP WITH TIME ZONE NOT NULL,
        mongodb_created_at    TIMESTAMP WITH TIME ZONE NOT NULL,
        
        created_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );

      CREATE INDEX tr_type ON ${TABLE_NAME}(account_name_from);
      CREATE INDEX account_name_from_idx ON ${TABLE_NAME}(account_name_from);
      CREATE INDEX account_name_to_idx ON ${TABLE_NAME}(account_name_to);
    `;

    return queryInterface.sequelize.query(sql);
  },

  down: (queryInterface) => {
    return queryInterface.dropTable(TABLE_NAME);
  }
};
