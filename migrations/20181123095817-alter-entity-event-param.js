const TABLE_NAME = 'entity_event_param';

module.exports = {
  up: (queryInterface) => {
    const sql = `
      CREATE INDEX ${TABLE_NAME}_created_at_idx ON ${TABLE_NAME}(created_at DESC)  
    `;

    return queryInterface.sequelize.query(sql);
  },

  down: (queryInterface) => {
    const sql = `
      DROP INDEX ${TABLE_NAME}_created_at_idx
    `;

    return queryInterface.sequelize.query(sql);
  }
};
