import { EventsIdsDictionary } from 'ucom.libs.common';

import ActivityHelper = require('../../../helpers/activity-helper');
import SeedsHelper = require('../../../helpers/seeds-helper');
import UsersActivityCommonHelper = require('../../../../helpers/users/activity/users-activity-common-helper');
import OrganizationsGenerator = require('../../../../generators/organizations-generator');

const { SocialApi } = require('ucom-libs-wallet');

let userVlad;
let userJane;

const JEST_TIMEOUT = 30000;

beforeAll(async () => { await SeedsHelper.noGraphQlNoMocking(); });

beforeEach(async () => {
  [userVlad, userJane] = await SeedsHelper.beforeAllRoutine();
});

afterAll(async () => { await SeedsHelper.afterAllWithoutGraphQl(); });

it('Follow', async () => {
  const organization = await OrganizationsGenerator.createOrgWithoutTeamAndGetModel(userJane);

  const signedTransactionObject = await SocialApi.getFollowOrganizationSignedTransaction(
    userVlad.account_name,
    userVlad.private_key,
    organization.blockchain_id,
  );

  await ActivityHelper.requestToFollowOrganization(
    organization.id,
    userVlad,
    201,
    signedTransactionObject,
  );

  const eventId = EventsIdsDictionary.getUserFollowsOrg();
  await UsersActivityCommonHelper.getProcessedActivity(userVlad.id, eventId);
}, JEST_TIMEOUT);

it('Unfollow', async () => {
  const organization = await OrganizationsGenerator.createOrgWithoutTeamAndGetModel(userJane);

  await ActivityHelper.requestToFollowOrganization(organization.id, userVlad);

  const signedTransactionObject = await SocialApi.getUnfollowOrganizationSignedTransaction(
    userVlad.account_name,
    userVlad.private_key,
    organization.blockchain_id,
  );

  await ActivityHelper.requestToUnfollowOrganization(
    organization.id,
    userVlad,
    201,
    signedTransactionObject,
  );

  const eventId = EventsIdsDictionary.getUserUnfollowsOrg();
  await UsersActivityCommonHelper.getProcessedActivity(userVlad.id, eventId);
}, JEST_TIMEOUT);

export {};
