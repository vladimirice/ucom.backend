const helpers = require('../helpers');

const { WalletApi } = require('uos-app-wallet');

let userVlad, userJane, userPetr, userRokky;
WalletApi.initForStagingEnv();

describe('Blockchain nodes get', () => {
  beforeAll(async () => {
    [userVlad, userJane, userPetr, userRokky] = await helpers.SeedsHelper.beforeAllRoutine();
  });

  describe('Positive', () => {
    it('Get nodes list without filters for guest', async () => {
      const data = await helpers.Blockchain.requestToGetNodesList();

      helpers.Blockchain.checkManyProducers(data, false);
    });

    it('Get nodes list without filters for myself', async () => {
      const data = await helpers.Blockchain.requestToGetNodesList(userVlad);
      helpers.Blockchain.checkManyProducers(data, true);

      // TODO hardcoded voting condition - should determine beforehand
      const calc1Producer = data.find(producer => producer.title === 'calc1');
      const calc2Producer = data.find(producer => producer.title === 'calc2');
      const calc3Producer = data.find(producer => producer.title === 'calc3');
      const calc4Producer = data.find(producer => producer.title === 'calc4');
      const calc5Producer = data.find(producer => producer.title === 'calc5');

      expect(calc3Producer.myselfData.bp_vote).toBeTruthy();
      expect(calc5Producer.myselfData.bp_vote).toBeTruthy();

      expect(calc1Producer.myselfData.bp_vote).toBeFalsy();
      expect(calc2Producer.myselfData.bp_vote).toBeFalsy();
      expect(calc4Producer.myselfData.bp_vote).toBeFalsy();
    });

    it('Get nodes list with myself_bp_vote=true filter - voted only', async () => {
      const data = await helpers.Blockchain.requestToGetNodesList(userVlad, true);
      helpers.Blockchain.checkManyProducers(data, true);

      // TODO hardcoded voting condition - should determine beforehand
      expect(data.length).toBe(2);
      expect(data.some(producer => producer.title === 'calc3' && producer.myselfData.bp_vote === true)).toBeDefined();
      expect(data.some(producer => producer.title === 'calc5' && producer.myselfData.bp_vote === true)).toBeDefined();
    });
  });

  describe('Negative', () => {
    it('Not possible to ask for myself_bp_vote=true without auth token', async () => {
      await helpers.Blockchain.requestToGetNodesList(null, true, 403);
    });
  });
});
