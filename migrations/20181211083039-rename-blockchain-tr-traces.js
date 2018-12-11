module.exports = {
  up: (queryInterface) => {
    const sql = `
      ALTER TABLE blockchain_tr_traces RENAME TO blockchain_tr_traces_rn_2;
      ALTER TABLE blockchain_tr_traces_rn RENAME TO blockchain_tr_traces;
    `;

    return queryInterface.sequelize.query(sql);
  },

  down: (queryInterface) => {
  }
};
