const TABLE_NAME = 'entity_event_param';

module.exports = {
  up: (queryInterface) => {
    const sql = `
      CREATE TABLE ${TABLE_NAME}
      (
        id                    SERIAL NOT NULL
                              CONSTRAINT ${TABLE_NAME}_pkey PRIMARY KEY,
        entity_blockchain_id  VARCHAR(255) NOT NULL,
        entity_name           CHAR(10) NOT NULL,
        json_value            JSONB NOT NULL,
        event_type            SMALLINT NOT NULL,
        
        created_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );
    `;

    return queryInterface.sequelize.query(sql);
  },

  down: (queryInterface) => {
    return queryInterface.dropTable(TABLE_NAME);
  }
};
