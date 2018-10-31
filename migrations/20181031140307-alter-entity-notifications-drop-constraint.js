const TABLE_NAME = 'entity_notifications';

module.exports = {
  up: (queryInterface) => {
    const sql = `
      ALTER TABLE "${TABLE_NAME}" DROP CONSTRAINT fk_user_id_from;
     `
    ;

    return queryInterface.sequelize.query(sql);
  },

  down: (queryInterface) => {}
};
