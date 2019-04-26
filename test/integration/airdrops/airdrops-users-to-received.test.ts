import { UserModel } from '../../../lib/users/interfaces/model-interfaces';
import { GraphqlHelper } from '../helpers/graphql-helper';

const { AirdropStatuses } = require('ucom.libs.common').Airdrop.Dictionary;

import SeedsHelper = require('../helpers/seeds-helper');
import AirdropsUsersToWaitingService = require('../../../lib/airdrops/service/status-changer/airdrops-users-to-waiting-service');
import AirdropsGenerator = require('../../generators/airdrops/airdrops-generator');
import AirdropsUsersGenerator = require('../../generators/airdrops/airdrops-users-generator');
import AirdropsUsersToPendingService = require('../../../lib/airdrops/service/status-changer/airdrops-users-to-pending-service');
import MockHelper = require('../helpers/mock-helper');
import AirdropsUsersToReceivedService = require('../../../lib/airdrops/service/status-changer/airdrops-users-to-received-service');
import AirdropsUsersRepository = require('../../../lib/airdrops/repository/airdrops-users-repository');
import AirdropsUsersChecker = require('../../helpers/airdrops-users-checker');
import RequestHelper = require('../helpers/request-helper');

let userVlad: UserModel;
let userJane: UserModel;

const beforeAfterOptions = {
  isGraphQl: true,
  workersMocking: 'all',
};

const JEST_TIMEOUT = 5000;

describe('Airdrops users to received', () => {
  beforeAll(async () => {
    await SeedsHelper.beforeAllSetting(beforeAfterOptions);
  });
  afterAll(async () => {
    await SeedsHelper.doAfterAll(beforeAfterOptions);
  });
  beforeEach(async () => {
    [userVlad, userJane] = await SeedsHelper.beforeAllRoutine();

    await AirdropsUsersGenerator.generateForVladAndJane();
  });

  it('process both users', async () => {
    MockHelper.mockAirdropsTransactionsSenderForSuccess();

    const { airdropId, orgId } = await AirdropsGenerator.createNewAirdrop(userVlad);

    await AirdropsUsersGenerator.fulfillAllAirdropConditionForManyUsers(
      airdropId,
      orgId,
      [userVlad, userJane],
    );

    await AirdropsUsersToPendingService.process(airdropId);
    await AirdropsUsersToWaitingService.process(100);

    const vladStateBefore = await AirdropsUsersRepository.getAllAirdropsUsersDataByUserId(userVlad.id, airdropId);
    const janeStateBefore = await AirdropsUsersRepository.getAllAirdropsUsersDataByUserId(userJane.id, airdropId);

    const mocksToSet: any[] = [];

    mocksToSet.push(vladStateBefore[0]);
    mocksToSet.push(vladStateBefore[1]);
    mocksToSet.push(janeStateBefore[0]);
    mocksToSet.push(janeStateBefore[1]);

    MockHelper.mockGetAirdropsReceiptTableRowsAfterExternalId(mocksToSet);

    await AirdropsUsersToReceivedService.process(airdropId);

    await AirdropsUsersChecker.checkWaitingToWalletTransfer(userVlad.id, airdropId, vladStateBefore);
    await AirdropsUsersChecker.checkWaitingToWalletTransfer(userJane.id, airdropId, janeStateBefore);


    const vladHeaders = RequestHelper.getAuthBearerHeader(<string>userVlad.token);

    const vladAirdropState = await GraphqlHelper.getOneUserAirdrop(airdropId, vladHeaders);
    expect(vladAirdropState.airdrop_status).toBe(AirdropStatuses.RECEIVED);

    const janeHeaders = RequestHelper.getAuthBearerHeader(<string>userJane.token);
    const janeAirdropState = await GraphqlHelper.getOneUserAirdrop(airdropId, janeHeaders);
    expect(janeAirdropState.airdrop_status).toBe(AirdropStatuses.RECEIVED);
  }, JEST_TIMEOUT * 100);

  it('process two users step by step', async () => {
    MockHelper.mockAirdropsTransactionsSenderForSuccess();

    const { airdropId, orgId } = await AirdropsGenerator.createNewAirdrop(userVlad);
    await AirdropsUsersToReceivedService.process(airdropId);


    await AirdropsUsersGenerator.fulfillAllAirdropConditionForManyUsers(
      airdropId,
      orgId,
      [userVlad, userJane],
    );

    await AirdropsUsersToPendingService.process(airdropId);
    await AirdropsUsersToWaitingService.process(100);

    const vladStateBefore = await AirdropsUsersRepository.getAllAirdropsUsersDataByUserId(userVlad.id, airdropId);
    const janeStateBefore = await AirdropsUsersRepository.getAllAirdropsUsersDataByUserId(userJane.id, airdropId);

    const mocksToSet: any[] = [];

    MockHelper.mockGetAirdropsReceiptTableRowsAfterExternalId(mocksToSet);

    await AirdropsUsersToReceivedService.process(airdropId);

    mocksToSet.push(vladStateBefore[0]);
    mocksToSet.push(janeStateBefore[0]);

    MockHelper.mockGetAirdropsReceiptTableRowsAfterExternalId(mocksToSet);
    await AirdropsUsersToReceivedService.process(airdropId);

    const vladHeaders = RequestHelper.getAuthBearerHeader(<string>userVlad.token);
    const vladAirdropStateNotReceived = await GraphqlHelper.getOneUserAirdrop(airdropId, vladHeaders);
    expect(vladAirdropStateNotReceived.airdrop_status).toBe(AirdropStatuses.PENDING); // no waiting - it is internal

    const janeHeaders = RequestHelper.getAuthBearerHeader(<string>userJane.token);
    const janeAirdropStateNotReceived = await GraphqlHelper.getOneUserAirdrop(airdropId, janeHeaders);
    expect(janeAirdropStateNotReceived.airdrop_status).toBe(AirdropStatuses.PENDING); // no waiting - it is internal


    mocksToSet.push(vladStateBefore[1]);
    MockHelper.mockGetAirdropsReceiptTableRowsAfterExternalId(mocksToSet);
    await AirdropsUsersToReceivedService.process(airdropId);

    const vladAirdropStateReceived = await GraphqlHelper.getOneUserAirdrop(airdropId, vladHeaders);
    expect(vladAirdropStateReceived.airdrop_status).toBe(AirdropStatuses.RECEIVED);

    const janeAirdropStateAfterVladStateReceived = await GraphqlHelper.getOneUserAirdrop(airdropId, janeHeaders);
    expect(janeAirdropStateAfterVladStateReceived.airdrop_status).toBe(AirdropStatuses.PENDING);

    mocksToSet.push(janeStateBefore[1]);
    MockHelper.mockGetAirdropsReceiptTableRowsAfterExternalId(mocksToSet);
    await AirdropsUsersToReceivedService.process(airdropId);

    const janeAirdropStateReceived = await GraphqlHelper.getOneUserAirdrop(airdropId, janeHeaders);
    expect(janeAirdropStateReceived.airdrop_status).toBe(AirdropStatuses.RECEIVED);

    await AirdropsUsersToReceivedService.process(airdropId);
  }, JEST_TIMEOUT * 10);
});

export {};
