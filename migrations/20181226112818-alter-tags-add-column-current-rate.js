const TABLE_NAME = 'tags';
const NEW_COLUMN = 'current_rate';

module.exports = {
  up: (queryInterface) => {
    const sql = `
      ALTER TABLE "${TABLE_NAME}" ADD COLUMN ${NEW_COLUMN} NUMERIC(20, 10) NOT NULL DEFAULT 0;
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
