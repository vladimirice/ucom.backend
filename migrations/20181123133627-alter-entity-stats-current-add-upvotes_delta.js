const TABLE_NAME = 'entity_stats_current';

module.exports = {
  up: (queryInterface) => {
    const sql = `
      ALTER TABLE ${TABLE_NAME} ADD COLUMN upvote_delta SMALLINT NOT NULL DEFAULT 0;
    ;
    `;

    return queryInterface.sequelize.query(sql);
  },

  down: (queryInterface) => {
    const sql = `
      ALTER TABLE "${TABLE_NAME}" DROP COLUMN upvote_delta;
     `
    ;

    return queryInterface.sequelize.query(sql);
  }
};
