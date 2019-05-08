import { UserModel } from '../../../../../lib/users/interfaces/model-interfaces';
import { UsersActivityModelDto } from '../../../../../lib/users/interfaces/users-activity/model-interfaces';

import SeedsHelper = require('../../../helpers/seeds-helper');
import RabbitMqService = require('../../../../../lib/jobs/rabbitmq-service');
import UsersActivityRequestHelper = require('../../../../helpers/users/activity/users-activity-request-helper');
import UsersActivityCommonHelper = require('../../../../helpers/users/activity/users-activity-common-helper');
import NotificationsEventIdDictionary = require('../../../../../lib/entities/dictionary/notifications-event-id-dictionary');
import TransactionsHelper = require('../../../../helpers/common/transactions-helper');
import TransactionsPushResponseChecker = require('../../../../helpers/common/transactions-push-response-checker');

require('jest-expect-message');

let userVlad: UserModel;
let userJane: UserModel;

const { SocialApi, WalletApi } = require('ucom-libs-wallet');

const beforeAfterOptions = {
  isGraphQl: true,
  workersMocking: 'nothing',
};

const JEST_TIMEOUT = 10000;
// @ts-ignore
const JEST_TIMEOUT_DEBUG = JEST_TIMEOUT * 1000;

describe('Users activity trust creation', () => {
  beforeAll(async () => {
    await SeedsHelper.beforeAllSetting(beforeAfterOptions);
  });
  afterAll(async () => {
    await SeedsHelper.doAfterAll(beforeAfterOptions);
  });
  beforeEach(async () => {
    [userVlad, userJane] = await SeedsHelper.beforeAllRoutine();
  });

  describe('Trust workflow', () => {
    it('Trust user and expect valid transaction', async () => {
      const privateKey = TransactionsHelper.getPrivateKey('vlad');

      WalletApi.setNodeJsEnv();
      WalletApi.initForTestEnv();

      const signedTransaction = await SocialApi.getTrustUserSignedTransactionsAsJson(
        userVlad.account_name,
        privateKey,
        userJane.account_name,
      );

      await RabbitMqService.purgeBlockchainQueue();
      await UsersActivityRequestHelper.trustOneUser(userVlad, userJane.id, signedTransaction);

      const eventId: number = NotificationsEventIdDictionary.getUserTrustsYou();
      const activity: UsersActivityModelDto =
        await UsersActivityCommonHelper.getProcessedActivity(userVlad.id, eventId);


      expect(activity.blockchain_status).toBe(1);

      const actualBlockchainResponse = JSON.parse(activity.blockchain_response);

      const expected = UsersActivityCommonHelper.getOneUserToOtherPushResponse(
        <string>userVlad.account_name,
        <string>userJane.account_name,
        true,
      );

      TransactionsPushResponseChecker.checkOneTransaction(actualBlockchainResponse, expected);
    }, JEST_TIMEOUT);
  });
  describe('Untrust workflow', () => {
    it('Untrust user and expect valid transaction', async () => {
      const privateKey = TransactionsHelper.getPrivateKey('vlad');

      WalletApi.setNodeJsEnv();
      WalletApi.initForTestEnv();

      const signedTransaction = await SocialApi.getTrustUserSignedTransactionsAsJson(
        userVlad.account_name,
        privateKey,
        userJane.account_name,
      );

      await RabbitMqService.purgeBlockchainQueue();
      await UsersActivityRequestHelper.trustOneUser(userVlad, userJane.id, signedTransaction);

      const eventId: number = NotificationsEventIdDictionary.getUserTrustsYou();
      await UsersActivityCommonHelper.getProcessedActivity(userVlad.id, eventId);


      // Then untrust
      const signedTransactionUntrust = await SocialApi.getUnTrustUserSignedTransactionsAsJson(
        userVlad.account_name,
        privateKey,
        userJane.account_name,
      );

      await RabbitMqService.purgeBlockchainQueue();
      await UsersActivityRequestHelper.untrustOneUser(userVlad, userJane.id, signedTransactionUntrust);

      const eventIdUntrust: number = NotificationsEventIdDictionary.getUserUntrustsYou();
      const activityUntrust: UsersActivityModelDto =
        await UsersActivityCommonHelper.getProcessedActivity(userVlad.id, eventIdUntrust);


      expect(activityUntrust.blockchain_status).toBe(1);

      const actualBlockchainResponse = JSON.parse(activityUntrust.blockchain_response);

      const expected = UsersActivityCommonHelper.getOneUserToOtherPushResponse(
        <string>userVlad.account_name,
        <string>userJane.account_name,
        false,
      );

      TransactionsPushResponseChecker.checkOneTransaction(actualBlockchainResponse, expected);
    }, JEST_TIMEOUT_DEBUG);
  });
});

export {};
