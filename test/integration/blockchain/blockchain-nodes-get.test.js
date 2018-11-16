const helpers = require('../helpers');

const { WalletApi } = require('uos-app-wallet');

let userVlad, userJane, userPetr, userRokky;
WalletApi.initForStagingEnv();

const initialMockFunction = WalletApi.getBlockchainNodes;

describe('Blockchain nodes get', () => {
  beforeAll(async () => {
    [userVlad, userJane, userPetr, userRokky] = await helpers.SeedsHelper.beforeAllRoutine();
  });

  beforeEach(async () => {
    await helpers.Seeds.destroyTables();
    await helpers.Seeds.initUsersOnly();
    await helpers.Blockchain.updateBlockchainNodes();
  });

  afterEach(() => {
    WalletApi.getBlockchainNodes = initialMockFunction;
  });

  describe('Sorting smoke tests', () => {
    it('order by different fields', async () => {
      const fieldsToSort = [
        'id', '-title', 'votes_count', '-votes_amount', 'bp_status',
      ];

      const queryString = `?sort_by=${fieldsToSort.join(',')}`;
      await helpers.Blockchain.requestToGetNodesList(null, false, 200, queryString);
    });
  });

  describe('Positive', () => {
    it('Get nodes list without filters for guest', async () => {
      const data = await helpers.Blockchain.requestToGetNodesList();

      helpers.Blockchain.checkManyProducers(data, false);
    });

    it('Get nodes list without filters for myself', async () => {
      // TODO hardcoded voting condition - should determine beforehand

      const replaceFor = {
        'vlad': [
            'calc2',
            'calc5',
            'calc4',
          ],
      };

      await helpers.Blockchain.mockGetBlockchainNodesWalletMethod([], replaceFor);
      await helpers.Blockchain.updateBlockchainNodes();

      const data = await helpers.Blockchain.requestToGetNodesList(userVlad);
      helpers.Blockchain.checkManyProducers(data, true);

      const calc2Producer = data.find(producer => producer.title === 'calc2');
      const calc4Producer = data.find(producer => producer.title === 'calc4');
      const calc5Producer = data.find(producer => producer.title === 'calc5');

      const calc3Producer = data.find(producer => producer.title === 'calc3');

      expect(calc3Producer.myselfData.bp_vote).toBeFalsy();

      expect(calc5Producer.myselfData.bp_vote).toBeTruthy();
      expect(calc2Producer.myselfData.bp_vote).toBeTruthy();
      expect(calc4Producer.myselfData.bp_vote).toBeTruthy();
    });

    it('Get nodes list with myself_bp_vote=true filter - voted only', async () => {
      const nodeTitlesToVote = [
        'calc2',
        'calc5',
        'calc4',
      ];

      const replaceFor = {
        'vlad': nodeTitlesToVote,
      };

      await helpers.Blockchain.mockGetBlockchainNodesWalletMethod([], replaceFor);
      await helpers.Blockchain.updateBlockchainNodes();

      const data = await helpers.Blockchain.requestToGetNodesList(userVlad, true);
      helpers.Blockchain.checkManyProducers(data, true);

      expect(data.length).toBe(nodeTitlesToVote.length);

      nodeTitlesToVote.forEach(title => {
        expect(data.some(producer => producer.title === title && producer.myselfData.bp_vote === true)).toBeTruthy()
      });
    });

    it('Get nodes which match only search criteria', async () => {
      await helpers.Blockchain.mockGetBlockchainNodesWalletMethod();
      await helpers.Blockchain.updateBlockchainNodes();

      const data = await helpers.Blockchain.requestToGetNodesList(userVlad, false, 200, '?&search=_sUp');

      const expectedTitles = [
        'z_super_new1',
        'z_super_new2',
      ];

      expect(data.length).toBe(2);

      expectedTitles.forEach(title => {
        expect(data.some(data => data.title === title)).toBeTruthy();
      });
    });

    it('should find nothing because nothing matches search request', async () => {
      await helpers.Blockchain.updateBlockchainNodes();
      const data = await helpers.Blockchain.requestToGetNodesList(userVlad, false, 200, '?&search=not_exists', true);

      expect(data.length).toBe(0);
    });
  });

  describe('Negative', () => {
    it('Not possible to ask for myself_bp_vote=true without auth token', async () => {
      await helpers.Blockchain.requestToGetNodesList(null, true, 403);
    });
  });
});
