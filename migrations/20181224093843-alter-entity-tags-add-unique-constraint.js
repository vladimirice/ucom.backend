const TABLE_NAME      = 'entity_tags';
const CONSTRAINT_NAME = 'unique_tag_title_entity_id_entity_name';

module.exports = {
  up: (queryInterface) => {
    const sql = `
      ALTER TABLE "${TABLE_NAME}" 
      ADD CONSTRAINT ${CONSTRAINT_NAME} 
      UNIQUE (tag_title, entity_id, entity_name);
   `;

    return queryInterface.sequelize.query(sql);
  },

  down: (queryInterface) => {
    const sql = `
      ALTER TABLE "${TABLE_NAME}" 
      DROP CONSTRAINT ${CONSTRAINT_NAME} 
   `;

    return queryInterface.sequelize.query(sql);
  }
};
