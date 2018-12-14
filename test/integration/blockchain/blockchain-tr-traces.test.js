const moment = require('moment');

const helpers = require('../helpers');
const gen     = require('../../generators');

const BlockchainTrTracesService     = require('../../../lib/eos/service/tr-traces-service/blockchain-tr-traces-service');
const BlockchainTrTracesRepository  = require('../../../lib/eos/repository/blockchain-tr-traces-repository');
const BlockchainTrTracesDictionary  = require('ucom-libs-wallet').Dictionary.BlockchainTrTraces;

helpers.Mock.mockAllBlockchainPart();
helpers.Mock.mockAllTransactionSigning();

let userVlad, userJane, userPetr, userRokky;

const JEST_TIMEOUT = 40000;

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
    it('Check stakeResources sync and fetch', async () => {
      const accountAlias = 'vlad';

      const netAmountSeparated = 2;
      const cpuAmountSeparated = 3;

      const netAmountBoth = 4;
      const cpuAmountBoth = 5;

      const [netSeparatedTr, cpuSeparatedTr, bothTr] = await Promise.all([
        gen.BlockchainTr.createStakeOrUnstake(accountAlias, netAmountSeparated, 0),
        gen.BlockchainTr.createStakeOrUnstake(accountAlias, 0, cpuAmountSeparated),
        gen.BlockchainTr.createStakeOrUnstake(accountAlias, netAmountBoth, cpuAmountBoth),
      ]);

      const trType = BlockchainTrTracesDictionary.getTypeStakeResources();

      await BlockchainTrTracesService.syncMongoDbAndPostgres([trType], [netSeparatedTr, cpuSeparatedTr, bothTr]);

      const queryString = helpers.Req.getPaginationQueryString(1, 10);
      const models = await helpers.Blockchain.requestToGetMyselfBlockchainTransactions(userVlad, 200, queryString);

      expect(models.length).toBe(3);

      let checked = 0;
      models.forEach(model => {
        if (model.raw_tr_data.id === netSeparatedTr) {
          expect(model.resources.net.tokens.self_delegated).toBe(netAmountSeparated);
          expect(model.resources.cpu.tokens.self_delegated).toBe(0);
          checked++;
        } else if (model.raw_tr_data.id === cpuSeparatedTr) {
          expect(model.resources.net.tokens.self_delegated).toBe(0);
          expect(model.resources.cpu.tokens.self_delegated).toBe(cpuAmountSeparated);
          checked++;
        } else if (model.raw_tr_data.id === bothTr) {
          expect(model.resources.net.tokens.self_delegated).toBe(netAmountBoth);
          expect(model.resources.cpu.tokens.self_delegated).toBe(cpuAmountBoth);
          checked++;
        }
      });

      expect(checked).toBe(3);

      helpers.Blockchain.checkMyselfBlockchainTransactionsStructure(models);

      // #task strict comparison

      // const orderBySet = ['external_id', 'ASC'];
      // const [firstModel, secondModel, thirdModel] =
      //   await BlockchainTrTracesRepository.findAllTrTracesWithAllDataByAccountName(userVlad.account_name, orderBySet);

      // const [expectedFirstModel, expectedSecondModel, expectedThirdModel] =
      //   helpers.Blockchain.getEthalonVladStakeTrTrace(userVlad.account_name);

      // expect(firstModel).toMatchObject(expectedFirstModel);
      // expect(secondModel).toMatchObject(expectedSecondModel);
      // expect(thirdModel).toMatchObject(expectedThirdModel);
    }, JEST_TIMEOUT);

    it('Check TR_TYPE_STAKE_WITH_UNSTAKE sync and fetch', async () => {
      const userAlias = 'vlad';

      const trOneNet = -1;
      const trOneCpu = 4;

      const trTwoNet = 3;
      const trTwoCpu = -2;

      const [trOne, trTwo] = await Promise.all([
        gen.BlockchainTr.createStakeOrUnstake(userAlias, trOneNet, trOneCpu),
        gen.BlockchainTr.createStakeOrUnstake(userAlias, trTwoNet, trTwoCpu),
      ]);

      const trType = BlockchainTrTracesDictionary.getTypeStakeWithUnstake();
      await BlockchainTrTracesService.syncMongoDbAndPostgres([trType], [trOne, trTwo]);


      const queryString = helpers.Req.getPaginationQueryString(1, 10);
      const models = await helpers.Blockchain.requestToGetMyselfBlockchainTransactions(userVlad, 200, queryString);
      expect(models.length).toBe(2);


      let checked = 0;
      models.forEach(model => {
        if (model.raw_tr_data.id === trOne) {
          expect(model.resources.cpu.tokens.self_delegated).toBe(trOneCpu);
          expect(model.resources.net.unstaking_request.amount).toBe(Math.abs(trOneNet));
          checked++;
        } else if (model.raw_tr_data.id === trTwo) {
          expect(model.resources.net.tokens.self_delegated).toBe(trTwoNet);
          expect(model.resources.cpu.unstaking_request.amount).toBe(Math.abs(trTwoCpu));
          checked++;
        }
      });

      expect(checked).toBe(2);

      helpers.Blockchain.checkMyselfBlockchainTransactionsStructure(models);

      // const orderBySet = ['external_id', 'ASC'];
      // const [firstModel, secondModel] =
      //   await BlockchainTrTracesRepository.findAllTrTracesWithAllDataByAccountName(userVlad.account_name, orderBySet);
      //
      // const [expectedFirstModel, expectedSecondModel] = helpers.Blockchain.getEtalonVladStakeWithUnstake();
      //
      // expect(firstModel).toMatchObject(expectedFirstModel);
      // expect(secondModel).toMatchObject(expectedSecondModel);

    }, JEST_TIMEOUT);

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

    it('Check TR_TYPE_CLAIM_EMISSION sync and fetch', async () => {
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

      const [expectedFirstModel] = helpers.Blockchain.getEtalonVladTrEmission();

      expect(firstModel).toMatchObject(expectedFirstModel);
    }, JEST_TIMEOUT * 4);

    it.skip('Check TR_TYPE_BUY_RAM sync and fetch', async () => {}, JEST_TIMEOUT);

    it.skip('Check TR_TYPE_SELL_RAM sync and fetch', async () => {});

    it.skip('Check TR_TYPE_MYSELF_REGISTRATION sync and fetch', async () => {});

    it('Check typeTransfer sync and fetch', async () => {
      const trType = BlockchainTrTracesDictionary.getTypeTransfer();

      // Hardcoded values from the "past" of blockchain. It is expected than these values will not be changed
      // Only if resync will happen
      // Without hardcoded ids it will be a big delay in searching
      const idLessThan    = '5c08e292f24a510c2ffdc7fb';
      const idGreaterThan = '5c08e15af24a510c2ffdbe27';

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

      firstModel.tr_executed_at   = moment(firstModel.tr_executed_at).utc().unix();
      secondModel.tr_executed_at  = moment(secondModel.tr_executed_at).utc().unix();

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

  it.skip('test real tr block data from blockchain', async () => {
    // now there is a mockup inside blockchain tr traces processor
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