import { EventsIdsDictionary } from 'ucom.libs.common';
import { UserModel } from '../../../../../lib/users/interfaces/model-interfaces';

import SeedsHelper = require('../../../helpers/seeds-helper');
import RabbitMqService = require('../../../../../lib/jobs/rabbitmq-service');
import UsersActivityRequestHelper = require('../../../../helpers/users/activity/users-activity-request-helper');
import UsersActivityCommonHelper = require('../../../../helpers/users/activity/users-activity-common-helper');
import TransactionsHelper = require('../../../../helpers/common/transactions-helper');
import TransactionsPushResponseChecker = require('../../../../helpers/common/transactions-push-response-checker');
import UsersHelper = require('../../../helpers/users-helper');

require('jest-expect-message');

let userVlad: UserModel;
let userJane: UserModel;

const { SocialApi, WalletApi } = require('ucom-libs-wallet');

const beforeAfterOptions = {
  isGraphQl: true,
  workersMocking: 'nothing',
};

const JEST_TIMEOUT = 30000;
// @ts-ignore
const JEST_TIMEOUT_DEBUG = JEST_TIMEOUT * 1000;

beforeAll(async () => {
  await SeedsHelper.beforeAllSetting(beforeAfterOptions);
});
afterAll(async () => {
  await SeedsHelper.doAfterAll(beforeAfterOptions);
});
beforeEach(async () => {
  [userVlad, userJane] = await SeedsHelper.beforeAllRoutine();
});

it('Trust user and expect valid transaction', async () => {
  const privateKey = TransactionsHelper.getSocialPrivateKey(UsersHelper.getUserVladAlias());

  const { blockchain_id, signed_transaction } = await SocialApi.getTrustUserWithAutoUpdateSignedTransaction(
    userVlad.account_name,
    privateKey,
    userJane.account_name,
    TransactionsHelper.getSocialPermission(),
  );

  await RabbitMqService.purgeBlockchainQueue();
  await UsersActivityRequestHelper.trustOneUserWithAutoUpdate(userVlad, userJane.id, blockchain_id, signed_transaction);

  const eventId: number = EventsIdsDictionary.getUserTrustsYou();
  await UsersActivityCommonHelper.getProcessedActivity(userVlad.id, eventId);
}, JEST_TIMEOUT);

it('Untrust user and expect valid transaction', async () => {
  const privateKey = TransactionsHelper.getSocialPrivateKey(UsersHelper.getUserVladAlias());

  const { blockchain_id: blockchainIdTrust, signed_transaction: signedTransactionTrust } =
    await SocialApi.getTrustUserWithAutoUpdateSignedTransaction(
      userVlad.account_name,
      privateKey,
      userJane.account_name,
      TransactionsHelper.getSocialPermission(),
    );

  await RabbitMqService.purgeBlockchainQueue();
  await UsersActivityRequestHelper.trustOneUserWithAutoUpdate(userVlad, userJane.id, blockchainIdTrust, signedTransactionTrust);

  const eventId: number = EventsIdsDictionary.getUserTrustsYou();
  await UsersActivityCommonHelper.getProcessedActivity(userVlad.id, eventId);

  // Then untrust
  const { blockchain_id, signed_transaction } = await SocialApi.getUntrustUserWithAutoUpdateSignedTransaction(
    userVlad.account_name,
    privateKey,
    userJane.account_name,
    TransactionsHelper.getSocialPermission(),
  );

  await RabbitMqService.purgeBlockchainQueue();
  await UsersActivityRequestHelper.untrustOneUserWithAutoUpdate(userVlad, userJane.id, blockchain_id, signed_transaction);

  const eventIdUntrust: number = EventsIdsDictionary.getUserUntrustsYou();
  await UsersActivityCommonHelper.getProcessedActivity(userVlad.id, eventIdUntrust);
}, JEST_TIMEOUT);

describe('Legacy - without autoUpdate inside', () => {
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

      const eventId: number = EventsIdsDictionary.getUserTrustsYou();
      const { blockchainResponse } =
          await UsersActivityCommonHelper.getProcessedActivity(userVlad.id, eventId);

      const expected = UsersActivityCommonHelper.getOneUserToOtherPushResponse(
          <string>userVlad.account_name,
          <string>userJane.account_name,
          true,
      );

      TransactionsPushResponseChecker.checkOneTransaction(blockchainResponse, expected);
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

      const eventId: number = EventsIdsDictionary.getUserTrustsYou();
      await UsersActivityCommonHelper.getProcessedActivity(userVlad.id, eventId);


      // Then untrust
      const signedTransactionUntrust = await SocialApi.getUnTrustUserSignedTransactionsAsJson(
        userVlad.account_name,
        privateKey,
        userJane.account_name,
      );

      await RabbitMqService.purgeBlockchainQueue();
      await UsersActivityRequestHelper.untrustOneUser(userVlad, userJane.id, signedTransactionUntrust);

      const eventIdUntrust: number = EventsIdsDictionary.getUserUntrustsYou();
      const { blockchainResponse } =
          await UsersActivityCommonHelper.getProcessedActivity(userVlad.id, eventIdUntrust);

      const expected = UsersActivityCommonHelper.getOneUserToOtherPushResponse(
          <string>userVlad.account_name,
          <string>userJane.account_name,
          false,
      );

      TransactionsPushResponseChecker.checkOneTransaction(blockchainResponse, expected);
    }, JEST_TIMEOUT);
  });
});

export {};
