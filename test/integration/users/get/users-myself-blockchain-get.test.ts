

const helpers = require('../../helpers');

helpers.Mock.mockAllBlockchainPart();
helpers.Mock.mockAllTransactionSigning();

let userVlad;

describe('Myself blockchain GET', () => {
  beforeAll(async () => {
    [userVlad] = await helpers.SeedsHelper.beforeAllRoutine();
  });

  afterAll(async () => {
    await helpers.SeedsHelper.sequelizeAfterAll();
  });

  beforeEach(async () => {
    await helpers.Seeds.initUsersOnly();
  });

  describe('Get blockchain transactions', () => {
    it.skip('Seed with sample transactions and test fetching', async () => {
    });

    it.skip('Pagination smoke test', async () => {
      const queryString = helpers.Req.getPaginationQueryString(2, 5);
      const models = await helpers.Blockchain.requestToGetMyselfBlockchainTransactions(
        userVlad,
        200,
        queryString,
      );
      helpers.Blockchain.checkMyselfBlockchainTransactionsStructure(models);
    });

    it.skip('Smoke test. Ensure different transactions structure', async () => {
      const models = await helpers.Blockchain.requestToGetMyselfBlockchainTransactions(userVlad);
      helpers.Blockchain.checkMyselfBlockchainTransactionsStructure(models);
    });
  });
});

export {};
