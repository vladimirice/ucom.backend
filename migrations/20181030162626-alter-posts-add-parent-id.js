const TABLE_NAME = 'posts';
const NEW_COLUMN = 'parent_id';

module.exports = {
  up: (queryInterface) => {
    const sql = `
      ALTER TABLE "${TABLE_NAME}" ADD COLUMN ${NEW_COLUMN} INTEGER DEFAULT NULL;
      
      ALTER TABLE ${TABLE_NAME} 
        ADD CONSTRAINT fk_${NEW_COLUMN}
        FOREIGN KEY (${NEW_COLUMN}) 
        REFERENCES posts(id);
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
