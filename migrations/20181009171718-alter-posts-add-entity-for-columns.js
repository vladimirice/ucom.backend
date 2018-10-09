const TABLE_NAME = 'posts';

module.exports = {
  up: (queryInterface) => {
    const sql = `
      ALTER TABLE ${TABLE_NAME} ADD COLUMN entity_id_for    BIGINT;
      ALTER TABLE ${TABLE_NAME} ADD COLUMN entity_name_for  CHAR(10);
     `
    ;

    return queryInterface.sequelize.query(sql);
  },

  down: (queryInterface) => {
    const sql = `
      ALTER TABLE ${TABLE_NAME} DROP COLUMN entity_id_for;
      ALTER TABLE ${TABLE_NAME} DROP COLUMN entity_name_for;
     `
    ;

    return queryInterface.sequelize.query(sql);
  }
};
