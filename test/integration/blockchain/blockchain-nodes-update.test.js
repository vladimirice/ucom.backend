const helpers = require('../helpers');

const { WalletApi } = require('uos-app-wallet');

let userVlad, userJane, userPetr, userRokky;
WalletApi.initForStagingEnv();

describe('Blockchain nodes get', () => {
  beforeAll(async () => {
    [userVlad, userJane, userPetr, userRokky] = await helpers.SeedsHelper.beforeAllRoutine();
  });

  describe('Update nodes', function () {
    it('should create new node records for empty database', async () => {
      await helpers.Blockchain.updateBlockchainNodes();

      const res = await helpers.Blockchain.getAllBlockchainNodes();
      expect(res.length).toBe(5); // hardcoded constant
    });

    it('should update node records - some nodes are added and some are removed', async () => {
      // initial state
      await helpers.Blockchain.updateBlockchainNodes();

      const {created, updated, deleted} = await helpers.Blockchain.mockGetBlockchainNodesWalletMethod();

      // new state
      await helpers.Blockchain.updateBlockchainNodes();
      const res = await helpers.Blockchain.requestToGetNodesList();

      updated.forEach(expected => {
        const actual = res.find(data => data.title === expected.title);
        expect(actual).toMatchObject(expected);
      });

      created.forEach(expected => {
        const actual = res.find(data => data.title === expected.title);
        expect(actual).toMatchObject(expected);
      });

      deleted.forEach(noExpectedTitle => {
        expect(res.some(data => data.title === noExpectedTitle)).toBeFalsy();
      });
    });
  });
});
