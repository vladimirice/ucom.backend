const TABLE_NAME = 'tags';
const NEW_COLUMN = 'current_posts_amount';

module.exports = {
  up: (queryInterface) => {
    const sql = `
      ALTER TABLE "${TABLE_NAME}" ADD COLUMN ${NEW_COLUMN} BIGINT NOT NULL DEFAULT 0;
     `
    ;

    return queryInterface.sequelize.query(sql);
  },

  down: (queryInterface) => {
    const sql = `
      ALTER TABLE "${TABLE_NAME}" DROP COLUMN ${NEW_COLUMN};
     `
    ;

    return queryInterface.sequelize.query(sql);
  }
};
