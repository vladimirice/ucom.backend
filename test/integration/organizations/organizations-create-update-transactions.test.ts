import { ContentTypesDictionary } from 'ucom.libs.common';
import { UserModel } from '../../../lib/users/interfaces/model-interfaces';
import { StringToAnyCollection } from '../../../lib/common/interfaces/common-types';
import { OrgModel } from '../../../lib/organizations/interfaces/model-interfaces';

import SeedsHelper = require('../helpers/seeds-helper');
import OrganizationsGenerator = require('../../generators/organizations-generator');
import knex = require('../../../config/knex');
import UsersModelProvider = require('../../../lib/users/users-model-provider');
import ActivityGroupDictionary = require('../../../lib/activity/activity-group-dictionary');
import CommonChecker = require('../../helpers/common/common-checker');
import UsersActivityCommonHelper = require('../../helpers/users/activity/users-activity-common-helper');
import OrganizationsRepository = require('../../../lib/organizations/repository/organizations-repository');
import OrganizationsResendingService = require('../../../lib/organizations/service/content-resending/organizations-resending-service');
import EosApi = require('../../../lib/eos/eosApi');

const { OrganizationsApi } = require('ucom-libs-wallet').Content;
const { EventsIds } = require('ucom.libs.common').Events.Dictionary;
const { EntityNames } = require('ucom.libs.common').Common.Dictionary;

const { RegistrationApi, MultiSignatureApi, ContentIdGenerator } = require('ucom-libs-wallet');

let userVlad: UserModel;
let userJane: UserModel;
let userRokky: UserModel;

const JEST_TIMEOUT = 15000;
// @ts-ignore
const JEST_TIMEOUT_DEBUG = JEST_TIMEOUT * 100;

beforeAll(async () => {
  await SeedsHelper.noGraphQlNoMocking();
});
afterAll(async () => {
  await SeedsHelper.afterAllWithoutGraphQlNoConnectionsKill();
});
beforeEach(async () => {
  [userVlad, userJane, , userRokky] = await SeedsHelper.beforeAllRoutine();
});

EosApi.initBlockchainLibraries();

it('Smoke - create a new organization as a multi-signature', async () => {
  const multiSignatureData = RegistrationApi.generateRandomDataForRegistration();

  const blockchainId = ContentIdGenerator.getForOrganization();

  const fakeProfile = {
    name: 'helloWorld',
    about: 'about the community',
    nickname: multiSignatureData.accountName,
    blockchain_id: blockchainId,
  };

  const teamMembers: UserModel[] = [userRokky];

  await MultiSignatureApi.createMultiSignatureAccount(
    userVlad.account_name, userVlad.private_key,

    multiSignatureData.accountName,
    multiSignatureData.ownerPrivateKey,
    multiSignatureData.ownerPublicKey,
    multiSignatureData.activePublicKey,
    fakeProfile,
    teamMembers.map((user: UserModel) => user.account_name),
  );

  const profile = {
    ...fakeProfile,
    is_multi_signature: true,
  };

  await OrganizationsGenerator.createOrgWithTeam(userVlad, teamMembers, profile);
}, JEST_TIMEOUT_DEBUG);

it('Create new organization providing a frontend transaction', async () => {
  const content: StringToAnyCollection = {
    // As much fields as possible in reality
    about:    'About new organization',
  };

  const { signed_transaction, blockchain_id } = await OrganizationsApi.signCreateOrganization(
    userVlad.account_name,
    userVlad.private_key,
    content,
  );

  const inputFields = {
    ...content,
    signed_transaction,
    blockchain_id,
  };

  const organization: OrgModel = await OrganizationsGenerator.createOrgWithoutTeamAndGetModel(userVlad, inputFields);

  expect(organization.blockchain_id).toBe(blockchain_id);

  const eventId = EventsIds.userCreatesOrganization();

  const activity = await knex(UsersModelProvider.getUsersActivityTableName())
    .where({
      activity_type_id:   ContentTypesDictionary.getTypeOrganization(),
      activity_group_id:  ActivityGroupDictionary.getGroupContentCreation(),
      user_id_from:       userVlad.id,
      entity_id_to:       organization.id,
      entity_name:        EntityNames.ORGANIZATIONS,
      event_id:           eventId,
    });

  CommonChecker.expectOnlyOneNotEmptyItem(activity);

  await UsersActivityCommonHelper.getProcessedActivity(userVlad.id, eventId);
}, JEST_TIMEOUT);

it('Update organization providing a frontend transaction', async () => {
  const organizationBefore: OrgModel = await OrganizationsGenerator.createOrgWithoutTeamAndGetModel(userVlad);

  const content: StringToAnyCollection = {
    // As much fields as possible in reality. Fetch them from organization
    about:    'About new organization',
  };

  const signed_transaction = await OrganizationsApi.signUpdateOrganization(
    userVlad.account_name,
    userVlad.private_key,
    content,
    organizationBefore.blockchain_id,
  );

  const fields = {
    signed_transaction,
  };

  await OrganizationsGenerator.updateOrganization(organizationBefore.id, userVlad, [], fields);

  const organizationAfter = await OrganizationsRepository.findOnlyItselfById(organizationBefore.id);
  expect(organizationAfter.blockchain_id).toBe(organizationBefore.blockchain_id);

  const eventId = EventsIds.userUpdatesOrganization();
  const activity = await knex(UsersModelProvider.getUsersActivityTableName())
    .where({
      activity_type_id:   ContentTypesDictionary.getTypeOrganization(),
      activity_group_id:  ActivityGroupDictionary.getGroupContentUpdating(),
      user_id_from:       userVlad.id,
      entity_id_to:       organizationAfter.id,
      entity_name:        EntityNames.ORGANIZATIONS,
      event_id:           eventId,
    });

  CommonChecker.expectOnlyOneNotEmptyItem(activity);

  await UsersActivityCommonHelper.getProcessedActivity(userVlad.id, eventId);
}, JEST_TIMEOUT_DEBUG);

it('Resend organizations - historical transactions', async () => {
  await Promise.all([
    OrganizationsGenerator.createOrgWithoutTeam(userVlad),
    OrganizationsGenerator.createOrgWithoutTeam(userJane),
  ]);

  await OrganizationsResendingService.resendOrganizations('2019-11-11', 2, true, 0);
}, JEST_TIMEOUT_DEBUG);

export {};
