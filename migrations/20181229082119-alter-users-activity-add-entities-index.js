const TABLE_NAME  = 'users_activity';
const IDX_NAME    = 'idx_users_activity_agi_uif_eit_en';

module.exports = {
  up: (queryInterface) => {
    const sql = `
      Create INDEX ${IDX_NAME} ON ${TABLE_NAME} (activity_group_id, user_id_from, entity_id_to, entity_name);
     `
    ;

    return queryInterface.sequelize.query(sql);
  },

  down: (queryInterface) => {
    const sql = `
      DROP INDEX ${IDX_NAME};
     `
    ;

    return queryInterface.sequelize.query(sql);
  }
};
