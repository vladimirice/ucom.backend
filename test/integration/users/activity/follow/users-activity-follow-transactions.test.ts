import { UserModel } from '../../../../../lib/users/interfaces/model-interfaces';

import ActivityHelper = require('../../../helpers/activity-helper');
import SeedsHelper = require('../../../helpers/seeds-helper');
import NotificationsEventIdDictionary = require('../../../../../lib/entities/dictionary/notifications-event-id-dictionary');
import UsersActivityCommonHelper = require('../../../../helpers/users/activity/users-activity-common-helper');

const { SocialApi } = require('ucom-libs-wallet');

let userVlad: UserModel;
let userJane: UserModel;

const JEST_TIMEOUT = 15000;

beforeAll(async () => { await SeedsHelper.noGraphQlNoMocking(); });

beforeEach(async () => {
  [userVlad, userJane] = await SeedsHelper.beforeAllRoutine();
});

afterAll(async () => { await SeedsHelper.afterAllWithoutGraphQl(); });

it('Follow', async () => {
  const signedTransactionObject = await SocialApi.getFollowAccountSignedTransaction(
    userVlad.account_name,
    userVlad.private_key,
    userJane.account_name,
  );

  await ActivityHelper.requestToCreateFollow(userVlad, userJane, 201, signedTransactionObject);

  const eventId = NotificationsEventIdDictionary.getUserFollowsYou();
  await UsersActivityCommonHelper.getProcessedActivity(userVlad.id, eventId);
}, JEST_TIMEOUT);

it('Unfollow', async () => {
  const signedTransactionObjectFollow = await SocialApi.getFollowAccountSignedTransaction(
    userVlad.account_name,
    userVlad.private_key,
    userJane.account_name,
  );

  await ActivityHelper.requestToCreateFollow(userVlad, userJane, 201, signedTransactionObjectFollow);

  const signedTransactionObject = await SocialApi.getUnfollowAccountSignedTransaction(
    userVlad.account_name,
    userVlad.private_key,
    userJane.account_name,
  );

  await ActivityHelper.requestToCreateUnfollow(userVlad, userJane, 201, signedTransactionObject);

  const eventId = NotificationsEventIdDictionary.getUserUnfollowsYou();
  await UsersActivityCommonHelper.getProcessedActivity(userVlad.id, eventId);
}, JEST_TIMEOUT);

export {};
