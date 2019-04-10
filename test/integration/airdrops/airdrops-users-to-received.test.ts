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

describe('Airdrops users to pending', () => {
  beforeAll(async () => {
    await SeedsHelper.beforeAllSetting(beforeAfterOptions);
  });
  afterAll(async () => {
    await SeedsHelper.doAfterAll(beforeAfterOptions);
  });
  beforeEach(async () => {
    [userVlad, userJane] = await SeedsHelper.beforeAllRoutine();
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

  it('test', async () => {
    // TODO
    // Process beforehand - no error (empty rows)
    // Process beforehand - no error (fake users, not related)

    // userVlad - status not received, userJane - not received
    // userVlad - received, userJane - not received
    // userJane - received
    // Process again - no error
  });
});

export {};
