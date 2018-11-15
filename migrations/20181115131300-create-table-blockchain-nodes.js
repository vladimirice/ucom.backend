const TABLE_NAME = 'blockchain_nodes';

module.exports = {
  up: (queryInterface) => {
    const sql = `
      CREATE TABLE ${TABLE_NAME}
      (
        id                SERIAL NOT NULL
                          CONSTRAINT ${TABLE_NAME}_pkey PRIMARY KEY,
                          
        title             VARCHAR(255) NOT NULL UNIQUE,
        votes_count       INT NOT NULL DEFAULT 0 CHECK(votes_count >= 0),
        votes_amount      BIGINT NOT NULL DEFAULT 0   CHECK(votes_amount >= 0),
        currency          VARCHAR(255) NOT NULL,
        bp_status         SMALLINT NOT NULL,
        
        created_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        deleted_at        TIMESTAMP WITH TIME ZONE DEFAULT NULL
      );
    `;

    return queryInterface.sequelize.query(sql);
  },

  down: (queryInterface) => {
    return queryInterface.dropTable(TABLE_NAME);
  }
};
