const TABLE_NAME = 'posts';
const NEW_COLUMN = 'entity_images';

module.exports = {
  up: (queryInterface) => {
    const sql = `
      ALTER TABLE "${TABLE_NAME}" ADD COLUMN ${NEW_COLUMN} JSONB DEFAULT NULL;
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
