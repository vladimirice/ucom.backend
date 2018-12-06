const helpers = require('../helpers');

const BlockchainTrTracesService     = require('../../../lib/eos/service/blockchain-tr-traces-service');
const BlockchainTrTracesRepository  = require('../../../lib/eos/repository/blockchain-tr-traces-repository');
const BlockchainTrTracesDictionary  = require('ucom-libs-wallet').Dictionary.BlockchainTrTraces;

helpers.Mock.mockAllBlockchainPart();
helpers.Mock.mockAllTransactionSigning();

let userVlad, userJane, userPetr, userRokky;

const JEST_TIMEOUT = 20000;

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
    it('Check TR_TYPE_STAKE_WITH_UNSTAKE sync and fetch', async () => {
      const trType = BlockchainTrTracesDictionary.getTypeStakeWithUnstake();

      // Hardcoded values from the "past" of blockchain. It is expected than these values will not be changed
      // Only if resync will happen
      // Without hardcoded ids it will be a big delay in searching
      const idLessThan    = '5c08f5fcf24a510c2fffd8da';
      const idGreaterThan = '5c00b648f24a510c2f9e11c1';

      await BlockchainTrTracesService.syncMongoDbAndPostgres([trType], idGreaterThan, idLessThan);

      const queryString = helpers.Req.getPaginationQueryString(1, 10);
      const models = await helpers.Blockchain.requestToGetMyselfBlockchainTransactions(userVlad, 200, queryString);
      expect(models.length).toBe(2);

      helpers.Blockchain.checkMyselfBlockchainTransactionsStructure(models);

      expect(models[0].resources.net.tokens.self_delegated).toBe(3);
      expect(models[0].resources.net.unstaking_request.amount).toBe(0);
      expect(models[0].resources.cpu.tokens.self_delegated).toBe(0);
      expect(models[0].resources.cpu.unstaking_request.amount).toBe(7);

      expect(models[1].resources.net.tokens.self_delegated).toBe(0);
      expect(models[1].resources.net.unstaking_request.amount).toBe(3);
      expect(models[1].resources.cpu.tokens.self_delegated).toBe(2);
      expect(models[1].resources.cpu.unstaking_request.amount).toBe(0);

      const orderBySet = ['external_id', 'ASC'];
      const [firstModel, secondModel] =
        await BlockchainTrTracesRepository.findAllTrTracesWithAllDataByAccountName(userVlad.account_name, orderBySet);

      const [expectedFirstModel, expectedSecondModel] = helpers.Blockchain.getEtalonVladStakeWithUnstake();

      expect(firstModel).toMatchObject(expectedFirstModel);
      expect(secondModel).toMatchObject(expectedSecondModel);

    }, 20000);

    it('Check TR_TYPE_UNSTAKING_REQUEST sync and fetch', async () => {
      const trType = BlockchainTrTracesDictionary.getTypeUnstakingRequest();

      // Hardcoded values from the "past" of blockchain. It is expected than these values will not be changed
      // Only if resync will happen
      // Without hardcoded ids it will be a big delay in searching
      const idLessThan    = '5c0906e7f24a510c2f0232ed';
      const idGreaterThan = '5c064130f24a510c2fe8b9da';

      await BlockchainTrTracesService.syncMongoDbAndPostgres([trType], idGreaterThan, idLessThan);

      const queryString = helpers.Req.getPaginationQueryString(1, 10);
      const models = await helpers.Blockchain.requestToGetMyselfBlockchainTransactions(userVlad, 200, queryString);
      expect(models.length).toBe(3);

      helpers.Blockchain.checkMyselfBlockchainTransactionsStructure(models);

      expect(models[0].resources.net.unstaking_request.amount).toBe(2);
      expect(models[0].resources.cpu.unstaking_request.amount).toBe(2);

      expect(models[1].resources.net.unstaking_request.amount).toBe(0);
      expect(models[1].resources.cpu.unstaking_request.amount).toBe(2);

      expect(models[2].resources.net.unstaking_request.amount).toBe(3);
      expect(models[2].resources.cpu.unstaking_request.amount).toBe(0);


      const orderBySet = ['external_id', 'ASC'];
      const [firstModel, secondModel, thirdModel] =
        await BlockchainTrTracesRepository.findAllTrTracesWithAllDataByAccountName(userVlad.account_name, orderBySet);

      const [expectedFirstModel, expectedSecondModel, expectedThirdModel] = helpers.Blockchain.getEtalonVladUnstakingRequests();

      expect(firstModel).toMatchObject(expectedFirstModel);
      expect(secondModel).toMatchObject(expectedSecondModel);
      expect(thirdModel).toMatchObject(expectedThirdModel);

    }, JEST_TIMEOUT);

    it.skip('Check TR_TYPE_CLAIM_EMISSION sync and fetch', async () => {
      const trType = BlockchainTrTracesDictionary.getTypeClaimEmission();

      // Hardcoded values from the "past" of blockchain. It is expected than these values will not be changed
      // Only if resync will happen
      // Without hardcoded ids it will be a big delay in searching
      const idLessThan    = '5c009373f24a510c2f01fd6e';
      const idGreaterThan = '5c007f42f24a510c2fb91192';

      await BlockchainTrTracesService.syncMongoDbAndPostgres([trType], idGreaterThan, idLessThan);

      const queryString = helpers.Req.getPaginationQueryString(1, 10);
      const models = await helpers.Blockchain.requestToGetMyselfBlockchainTransactions(userVlad, 200, queryString);
      expect(models.length).toBe(1);

      helpers.Blockchain.checkMyselfBlockchainTransactionsStructure(models);

      expect(models[0].tokens.emission).toBe(4075.2938);

      const orderBySet = ['external_id', 'ASC'];
      const [firstModel] =
        await BlockchainTrTracesRepository.findAllTrTracesWithAllDataByAccountName(userVlad.account_name, orderBySet);

      const [expectedFirstModel] = helpers.Blockchain.getEtalonVladTrTraces();

      expect(firstModel).toMatchObject(expectedFirstModel);
    }, JEST_TIMEOUT * 3);

    it.skip('Check TR_TYPE_BUY_RAM sync and fetch', async () => {
      const trType = BlockchainTrTracesDictionary.getTypeBuyRamBytes();

      // Hardcoded values from the "past" of blockchain. It is expected than these values will not be changed
      // Only if resync will happen
      // Without hardcoded ids it will be a big delay in searching
      const idLessThan    = '5c009373f24a510c2f01fd6e';
      const idGreaterThan = '5c007f42f24a510c2fb91192';

      await BlockchainTrTracesService.syncMongoDbAndPostgres([trType], idGreaterThan, idLessThan);

      const queryString = helpers.Req.getPaginationQueryString(1, 10);
      const models = await helpers.Blockchain.requestToGetMyselfBlockchainTransactions(userVlad, 200, queryString);
      expect(models.length).toBe(1);

      helpers.Blockchain.checkMyselfBlockchainTransactionsStructure(models);

      expect(models[0].tokens.emission).toBe(4075.2938);

      const orderBySet = ['external_id', 'ASC'];
      const [firstModel] =
        await BlockchainTrTracesRepository.findAllTrTracesWithAllDataByAccountName(userVlad.account_name, orderBySet);

      const [expectedFirstModel] = helpers.Blockchain.getEtalonVladTrTraces();

      expect(firstModel).toMatchObject(expectedFirstModel);
    }, JEST_TIMEOUT);

    it.skip('Check TR_TYPE_SELL_RAM sync and fetch', async () => {

    });

    it.skip('Check TR_TYPE_MYSELF_REGISTRATION sync and fetch', async () => {});

    it('Check typeTransfer sync and fetch', async () => {
      const trType = BlockchainTrTracesDictionary.getTypeTransfer();

      // Hardcoded values from the "past" of blockchain. It is expected than these values will not be changed
      // Only if resync will happen
      // Without hardcoded ids it will be a big delay in searching
      const idLessThan    = '5c08e292f24a510c2ffdc7fb';
      const idGreaterThan = '5c07debdf24a510c2ff5a843';

      await BlockchainTrTracesService.syncMongoDbAndPostgres([trType], idGreaterThan, idLessThan);

      const queryString = helpers.Req.getPaginationQueryString(1, 10);
      const models = await helpers.Blockchain.requestToGetMyselfBlockchainTransactions(userVlad, 200, queryString);
      expect(models.length).toBe(2);

      helpers.Blockchain.checkMyselfBlockchainTransactionsStructure(models);

      const modelTransferFrom = models.find(model => model.tr_type === BlockchainTrTracesDictionary.getLabelTransferFrom());
      const modelTransferTo = models.find(model => model.tr_type === BlockchainTrTracesDictionary.getLabelTransferTo());

      expect(modelTransferFrom.tokens.active).toBe(6);
      expect(modelTransferTo.tokens.active).toBe(5);

      helpers.Users.checkIncludedUserPreview(modelTransferFrom);
      helpers.Users.checkIncludedUserPreview(modelTransferTo);

      const orderBySet = ['external_id', 'ASC'];
      const [firstModel, secondModel] =
        await BlockchainTrTracesRepository.findAllTrTracesWithAllDataByAccountName(userVlad.account_name, orderBySet);

      const [expectedFirstModel, expectedSecondModel] = helpers.Blockchain.getEtalonVladTrTraces();

      expect(firstModel).toMatchObject(expectedFirstModel);
      expect(secondModel).toMatchObject(expectedSecondModel);

    }, 200000);

    it.skip('Check stakeResources sync and fetch', async () => {
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
    }, 200000);

    it('Check voteForBP sync and fetch', async () => {
      const trType = BlockchainTrTracesDictionary.getTypeVoteForBp();

      // Hardcoded values from the "past" of blockchain. It is expected than these values will not be changed
      // Only if resync will happen
      // Without hardcoded ids it will be a big delay in searching
      const idLessThan    = '5c0089f2f24a510c2fdda09a';
      const idGreaterThan = '5c0089f2f24a510c2fdda070';

      await BlockchainTrTracesService.syncMongoDbAndPostgres([trType], idGreaterThan, idLessThan);

      const queryString = helpers.Req.getPaginationQueryString(1, 10);
      const models = await helpers.Blockchain.requestToGetMyselfBlockchainTransactions(userVlad, 200, queryString);

      expect(models.length).toBe(2);


      const modelWithEmptyProducers = models.find(model => model.producers.length === 0);
      const modelWithProducers = models.find(model => model.producers.length > 0);

      expect(modelWithEmptyProducers).toBeDefined();
      expect(modelWithProducers.producers.length).toBe(2);
      expect(modelWithProducers.producers).toMatchObject(['calc2', 'calc4']);

      helpers.Blockchain.checkMyselfBlockchainTransactionsStructure(models);

      const orderBySet = ['external_id', 'ASC'];
      const [firstModel, secondModel] =
        await BlockchainTrTracesRepository.findAllTrTracesWithAllDataByAccountName(userVlad.account_name, orderBySet);

      const [expectedFirstModel, expectedSecondModel] = helpers.Blockchain.getEthalonVladVotesForBp();

      expect(firstModel).toMatchObject(expectedFirstModel);
      expect(secondModel).toMatchObject(expectedSecondModel);
    }, JEST_TIMEOUT);
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