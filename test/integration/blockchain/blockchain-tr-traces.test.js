const helpers = require('../helpers');

const BlockchainTrTracesService     = require('../../../lib/eos/service/blockchain-tr-traces-service');
const BlockchainTrTracesRepository  = require('../../../lib/eos/repository/blockchain-tr-traces-repository');
const BlockchainTrTracesDictionary  = require('uos-app-wallet').Dictionary.BlockchainTrTraces;

helpers.Mock.mockAllBlockchainPart();
helpers.Mock.mockAllTransactionSigning();

let userVlad, userJane, userPetr, userRokky;

describe('Blockchain tr traces sync tests', () => {
  beforeAll(async () => {
    [userVlad, userJane, userPetr, userRokky] = await helpers.SeedsHelper.beforeAllRoutine();
  });

  afterAll(async () => {
    await helpers.SeedsHelper.sequelizeAfterAll();
  });

  beforeEach(async () => {
    await helpers.SeedsHelper.initUsersOnly();
  });

  describe('check sync', function () {
    it.skip('Check sync of all other types of transactions', async () => {

    });

    it('Check stakeResources sync', async () => {
      const trType = BlockchainTrTracesDictionary.getTypeStakeResources();

      // Hardcoded values from the "past" of blockchain. It is expected than these values will not be changed
      // Only if resync will happen
      // Without hardcoded ids it will be a big delay in searching
      const idLessThan    = '5c0084d9f24a510c2fcc2881';
      const idGreaterThan = '5c0076b2f24a510c2f9bae82';

      await BlockchainTrTracesService.syncMongoDbAndPostgres([trType], idGreaterThan, idLessThan);

      const queryString = helpers.Req.getPaginationQueryString(1, 10);
      const models = await helpers.Blockchain.requestToGetMyselfBlockchainTransactions(userVlad, 200, queryString);

      expect(models.length).toBe(2);

      expect(models[0].resources.net.tokens.self_delegated).toBe(8);
      expect(models[0].resources.cpu.tokens.self_delegated).toBe(8);

      expect(models[1].resources.net.tokens.self_delegated).toBe(80);
      expect(models[1].resources.cpu.tokens.self_delegated).toBe(80);

      helpers.Blockchain.checkMyselfBlockchainTransactionsStructure(models);

      const orderBySet = ['external_id', 'ASC'];
      const [firstModel, secondModel] =
        await BlockchainTrTracesRepository.findAllTrTracesWithAllDataByAccountName(userVlad.account_name, orderBySet);

      const [expectedFirstModel, expectedSecondModel] = helpers.Blockchain.getEthalonVladStakeTrTrace();

      expect(firstModel).toMatchObject(expectedFirstModel);
      expect(secondModel).toMatchObject(expectedSecondModel);
    }, 200000)
  });

  describe('Send new transactions and check that sync is working for them', () => {
    it.skip('send transaction, sync and observe it inside Db', async () => {
      // fetch last transaction for every tested set of data
      // Send transactions via wallet
      // sync tr-traces
      // Find transactions which is sent
    });
  });
});