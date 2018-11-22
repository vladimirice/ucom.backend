const TABLE_NAME = 'entity_stats_current';

module.exports = {
  up: (queryInterface) => {
    const sql = `
      CREATE TABLE ${TABLE_NAME}
      (
        id                    SERIAL NOT NULL
                              CONSTRAINT ${TABLE_NAME}_pkey PRIMARY KEY,
                              
        entity_id             BIGINT NOT NULL,
        entity_name           CHAR(10) NOT NULL,
        importance_delta      NUMERIC(20,10) NOT NULL DEFAULT 0,
        
        created_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );
      
      CREATE UNIQUE INDEX entity_id_entity_name_idx ON ${TABLE_NAME} (entity_id, entity_name);
    `;

    return queryInterface.sequelize.query(sql);
  },

  down: (queryInterface) => {
    return queryInterface.dropTable(TABLE_NAME);
  }
};
