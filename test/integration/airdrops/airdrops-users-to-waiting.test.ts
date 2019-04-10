import { UserModel } from '../../../lib/users/interfaces/model-interfaces';

import SeedsHelper = require('../helpers/seeds-helper');
import AirdropsUsersToWaitingService = require('../../../lib/airdrops/service/status-changer/airdrops-users-to-waiting-service');
import AirdropsGenerator = require('../../generators/airdrops/airdrops-generator');
import AirdropsUsersGenerator = require('../../generators/airdrops/airdrops-users-generator');
import AirdropsUsersToPendingService = require('../../../lib/airdrops/service/status-changer/airdrops-users-to-pending-service');
import MockHelper = require('../helpers/mock-helper');
import OutgoingTransactionsLogRepository = require('../../../lib/eos/repository/outgoing-transactions-log-repository');
import AirdropsUsersRepository = require('../../../lib/airdrops/repository/airdrops-users-repository');
import AirdropsUsersChecker = require('../../helpers/airdrops-users-checker');
import OrganizationsHelper = require('../helpers/organizations-helper');

let userVlad: UserModel;
let userJane: UserModel;

const beforeAfterOptions = {
  isGraphQl: true,
  workersMocking: 'all',
};

const JEST_TIMEOUT = 5000;

describe('Airdrops users to waiting', () => {
  beforeAll(async () => {
    await SeedsHelper.beforeAllSetting(beforeAfterOptions);
  });
  afterAll(async () => {
    await SeedsHelper.doAfterAll(beforeAfterOptions);
  });
  beforeEach(async () => {
    [userVlad, userJane] = await SeedsHelper.beforeAllRoutine();
  });

  it('process two pending users', async () => {
    const { processedCounter: processedCounterBefore } = await AirdropsUsersToWaitingService.process(1000);
    expect(processedCounterBefore).toBe(0);

    MockHelper.mockAirdropsTransactionsSenderForSuccess();

    const { airdropId, orgId } = await AirdropsGenerator.createNewAirdrop(userVlad);

    await AirdropsUsersGenerator.fulfillAirdropCondition(airdropId, userVlad, orgId, true);
    await AirdropsUsersGenerator.fulfillAirdropCondition(airdropId, userJane, orgId, true);

    await AirdropsUsersToPendingService.process(airdropId);

    const vladStateBefore = await AirdropsUsersRepository.getAllAirdropsUsersDataByUserId(userVlad.id, airdropId);
    const janeStateBefore = await AirdropsUsersRepository.getAllAirdropsUsersDataByUserId(userJane.id, airdropId);

    const limit = 100;
    const { processedCounter: processedCounterAfter } = await AirdropsUsersToWaitingService.process(limit);
    expect(processedCounterAfter).toBe(4);

    const outgoing = await OutgoingTransactionsLogRepository.findAll();
    expect(outgoing.length).toBe(4);

    await AirdropsUsersChecker.checkReservedToWaitingTransfer(userVlad.id, airdropId, vladStateBefore);
    await AirdropsUsersChecker.checkReservedToWaitingTransfer(userJane.id, airdropId, janeStateBefore);

    const { processedCounter: processedCounterAfterAll } = await AirdropsUsersToWaitingService.process(1000);
    expect(processedCounterAfterAll).toBe(0);
  }, JEST_TIMEOUT);

  it('one user is ready but not other', async () => {
    MockHelper.mockAirdropsTransactionsSenderForSuccess();

    const { airdropId, orgId } = await AirdropsGenerator.createNewAirdrop(userVlad);

    await AirdropsUsersGenerator.fulfillAirdropCondition(airdropId, userVlad, orgId, true);
    await AirdropsUsersGenerator.fulfillAirdropCondition(airdropId, userJane, orgId, false);

    await AirdropsUsersToPendingService.process(airdropId);

    const vladStateBefore = await AirdropsUsersRepository.getAllAirdropsUsersDataByUserId(userVlad.id, airdropId);

    const limit = 100;
    const { processedCounter: processedCounterAfter } = await AirdropsUsersToWaitingService.process(limit);
    expect(processedCounterAfter).toBe(2);

    const outgoing = await OutgoingTransactionsLogRepository.findAll();
    expect(outgoing.length).toBe(2);

    await AirdropsUsersChecker.checkReservedToWaitingTransfer(userVlad.id, airdropId, vladStateBefore);

    const janeStateBefore =
      await AirdropsUsersRepository.getAllAirdropsUsersDataByUserId(userJane.id, airdropId);

    expect(janeStateBefore.length).toBe(0);

    await OrganizationsHelper.requestToFollowOrganization(orgId, userJane);
    await AirdropsUsersToPendingService.process(airdropId);

    const janeStateBeforeWaiting =
      await AirdropsUsersRepository.getAllAirdropsUsersDataByUserId(userJane.id, airdropId);

    const { processedCounter: processedCounterJane } = await AirdropsUsersToWaitingService.process(limit);
    expect(processedCounterJane).toBe(2);

    const outgoingWithJane = await OutgoingTransactionsLogRepository.findAll();
    expect(outgoingWithJane.length).toBe(4);

    await AirdropsUsersChecker.checkReservedToWaitingTransfer(userJane.id, airdropId, janeStateBeforeWaiting);
  }, JEST_TIMEOUT);

  it('Check pagination', async () => {
    MockHelper.mockAirdropsTransactionsSenderForSuccess();

    const { airdropId, orgId } = await AirdropsGenerator.createNewAirdrop(userVlad);

    await AirdropsUsersGenerator.fulfillAirdropCondition(airdropId, userVlad, orgId, true);
    await AirdropsUsersGenerator.fulfillAirdropCondition(airdropId, userJane, orgId, true);

    await AirdropsUsersToPendingService.process(airdropId);

    const vladStateBefore = await AirdropsUsersRepository.getAllAirdropsUsersDataByUserId(userVlad.id, airdropId);
    const janeStateBefore = await AirdropsUsersRepository.getAllAirdropsUsersDataByUserId(userJane.id, airdropId);

    const limit = 2;
    const { processedCounter: processedCounterAfter } = await AirdropsUsersToWaitingService.process(limit);
    expect(processedCounterAfter).toBe(4);

    const outgoing = await OutgoingTransactionsLogRepository.findAll();
    expect(outgoing.length).toBe(4);

    await AirdropsUsersChecker.checkReservedToWaitingTransfer(userVlad.id, airdropId, vladStateBefore);
    await AirdropsUsersChecker.checkReservedToWaitingTransfer(userJane.id, airdropId, janeStateBefore);
  });
});

export {};
