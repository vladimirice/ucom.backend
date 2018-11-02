const TABLE_NAME = 'Users';

module.exports = {
  up: (queryInterface) => {
    const sql = `
      ALTER TABLE "${TABLE_NAME}" ADD CONSTRAINT unique_private_key       UNIQUE (private_key);
      ALTER TABLE "${TABLE_NAME}" ADD CONSTRAINT unique_owner_public_key  UNIQUE (owner_public_key);
     `
    ;

    return queryInterface.sequelize.query(sql);
  },

  down: (queryInterface) => {}
};
