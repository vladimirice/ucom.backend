import { UserModel } from '../../../lib/users/interfaces/model-interfaces';
import { JEST_TIMEOUT_LONGER } from '../../helpers/jest-dictionary';
import { OrgModel } from '../../../lib/organizations/interfaces/model-interfaces';

import SeedsHelper = require('../helpers/seeds-helper');
import OrganizationsGenerator = require('../../generators/organizations-generator');
import EosApi = require('../../../lib/eos/eosApi');

import PostsGenerator = require('../../generators/posts-generator');
import RequestHelper = require('../helpers/request-helper');

const moment = require('moment');

const {
  RegistrationApi, MultiSignatureApi, ContentIdGenerator, ContentPublicationsActionsApi,
} = require('ucom-libs-wallet');

let userVlad: UserModel;
let userRokky: UserModel;

const JEST_TIMEOUT = 15000;
// @ts-ignore
const JEST_TIMEOUT_DEBUG = JEST_TIMEOUT * 100;

EosApi.initBlockchainLibraries();

beforeAll(async () => {
  await SeedsHelper.noGraphQlNoMocking();
});
afterAll(async () => {
  await SeedsHelper.afterAllWithoutGraphQlNoConnectionsKill();
});
beforeEach(async () => {
  // eslint-disable-next-line unicorn/no-unreadable-array-destructuring
  [userVlad, , , userRokky] = await SeedsHelper.beforeAllRoutine();
});

EosApi.initBlockchainLibraries();

const multiSignatureAccount = 'cz4kagygcrrd';

it('Smoke - new organization as a multi-signature', async () => {
  const multiSignatureData = RegistrationApi.generateRandomDataForRegistration();

  const blockchainId = ContentIdGenerator.getForOrganization();

  const fakeProfile = {
    title: 'helloWorld',
    about: 'about the community',
    nickname: multiSignatureData.accountName,
    blockchain_id: blockchainId,
  };

  const teamMembers: UserModel[] = [userRokky];
  const teamMembersNames: string[] = teamMembers.map((user: UserModel) => user.account_name);

  await MultiSignatureApi.createMultiSignatureAccount(
    userVlad.account_name, userVlad.private_key,

    multiSignatureData.accountName,
    multiSignatureData.ownerPrivateKey,
    multiSignatureData.ownerPublicKey,
    multiSignatureData.activePublicKey,
    fakeProfile,
    teamMembersNames,
  );

  const profile = {
    ...fakeProfile,
    is_multi_signature: true,
  };

  // Send information to the backend
  const organizationId = await OrganizationsGenerator.createOrgWithTeam(userVlad, teamMembers, profile);

  const updatedProfile = {
    ...fakeProfile,
    title: `helloWorld: ${moment().utc().format()}`,
    about: `about the community: ${moment().utc().format()}`,
  };

  // this is the case for the auto-tests. In reality, if team members board is not changed - call different method
  await MultiSignatureApi.createAndExecuteProfileUpdateAndSocialMembers(
    userVlad.account_name,
    userVlad.private_key,
    multiSignatureData.accountName,
    updatedProfile,
    teamMembersNames,
  );

  await OrganizationsGenerator.updateOrganization(organizationId, userVlad, teamMembers, updatedProfile, false);
}, JEST_TIMEOUT_LONGER);

it('Smoke - create and update media-post from organization', async () => {
  const organization: OrgModel = await OrganizationsGenerator.createOrgWithoutTeamAndGetModel(userVlad);

  // Test purposes only - create multi-signature organization directly in the real case
  await OrganizationsGenerator.migrateOrganizationToMultiSignature(userVlad, organization.id, multiSignatureAccount);

  const content = {
    title:          'Cool sample post',
    description:    'Cool sample post description #winter #summer',
    leading_text:   '',
    entity_images:  {},
    entity_tags:    ['winter', 'summer'],
  };

  const { action, blockchain_id } = ContentPublicationsActionsApi.getCreatePublicationFromOrganizationAction(
    multiSignatureAccount, organization.blockchain_id, content,
  );

  await MultiSignatureApi.proposeApproveAndExecuteByProposer(
    userVlad.account_name, userVlad.social_private_key, 'social', [action],
  );

  const postId = await PostsGenerator.createMediaPostOfOrganization(
    userVlad,
    organization.id,
    {
      ...content,
      blockchain_id,
      // to not send a signed_transaction
    },
    false,
  );

  // Then, update this post
  // #task - move to the separate test case
  const updatedContent = {
    ...content,
    title: 'updated title',
  };

  const updatePostAction = ContentPublicationsActionsApi.getUpdatePublicationFromOrganizationAction(
    multiSignatureAccount,
    organization.blockchain_id,
    updatedContent,
    blockchain_id,
  );

  await MultiSignatureApi.proposeApproveAndExecuteByProposer(
    userVlad.account_name, userVlad.social_private_key, 'social', [updatePostAction],
  );

  await RequestHelper.makePatchRequestAsMyselfWithFields(
    RequestHelper.getOnePostV2Url(postId),
    userVlad,
    {
      ...updatedContent,
      blockchain_id,
    },
  );
}, JEST_TIMEOUT_LONGER * 5);

it('Smoke - create new organization as content and change it to the multi-signature', async () => {
  const organizationId = await OrganizationsGenerator.createOrgWithoutTeam(userVlad);

  // Test purposes only - create multi-signature organization directly in the real case
  await OrganizationsGenerator.migrateOrganizationToMultiSignature(userVlad, organizationId, multiSignatureAccount);
});

export {};
