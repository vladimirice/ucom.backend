const TABLE_NAME = 'entity_notifications';

module.exports = {
  up: (queryInterface) => {
    const sql = `
      CREATE TABLE ${TABLE_NAME}
      (
        id                    SERIAL NOT NULL
                              CONSTRAINT ${TABLE_NAME}_pkey PRIMARY KEY,
        domain_id             SMALLINT NOT NULL,
        event_id              SMALLINT NOT NULL,
                          
        title                 VARCHAR(1024) NOT NULL,
        description           TEXT NOT NULL,
        
        finished              BOOLEAN NOT NULL DEFAULT false,
        seen                  BOOLEAN NOT NULL DEFAULT false,
        confirmed             SMALLINT NOT NULL DEFAULT 0,
        
        severity              SMALLINT NOT NULL DEFAULT 6,
        notification_type_id  SMALLINT NOT NULL,
        
        recipient_entity_id   BIGINT NOT NULL,
        recipient_entity_name CHAR(10) NOT NULL,
        
        entity_id             BIGINT NOT NULL,
        entity_name           CHAR(10) NOT NULL,
        
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
