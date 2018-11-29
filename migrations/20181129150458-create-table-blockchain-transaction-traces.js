const TABLE_NAME = 'blockchain_transaction_traces';

module.exports = {
  up: (queryInterface) => {
    const sql = `
      CREATE TABLE ${TABLE_NAME}
      (
        id                    BIGSERIAL NOT NULL
                              CONSTRAINT ${TABLE_NAME}_pkey PRIMARY KEY,
                              
        tr_type               SMALLINT NOT NULL,
        tr_status             VARCHAR(255) DEFAULT NULL,
        tr_processed_data     JSONB NOT NULL,
        
        memo                  VARCHAR(2048) NOT NULL DEFAULT '',
        tr_id                 VARCHAR(1024) NOT NULL,
        external_id           VARCHAR(1024) NOT NULL,             
        
        account_name_from     VARCHAR(255) DEFAULT NULL,
        account_name_to       VARCHAR(255) DEFAULT NULL,
          
        raw_tr_data           JSONB NOT NULL,
        executed_at           TIMESTAMP WITH TIME ZONE NOT NULL,
        
        created_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );
    `;

    return queryInterface.sequelize.query(sql);
  },

  down: (queryInterface) => {
    return queryInterface.dropTable(TABLE_NAME);
  }
};
