import { UserModel } from '../../../../lib/users/interfaces/model-interfaces';
import { StringToAnyCollection } from '../../../../lib/common/interfaces/common-types';
import { OrgModel } from '../../../../lib/organizations/interfaces/model-interfaces';
import { PostModel } from '../../../../lib/posts/interfaces/model-interfaces';

import SeedsHelper = require('../../helpers/seeds-helper');
import PostsGenerator = require('../../../generators/posts-generator');
import knex = require('../../../../config/knex');
import UsersModelProvider = require('../../../../lib/users/users-model-provider');
import CommonChecker = require('../../../helpers/common/common-checker');
import UsersActivityCommonHelper = require('../../../helpers/users/activity/users-activity-common-helper');
import OrganizationsGenerator = require('../../../generators/organizations-generator');
import NotificationsEventIdDictionary = require('../../../../lib/entities/dictionary/notifications-event-id-dictionary');
import PostsHelper = require('../../helpers/posts-helper');

const { ContentTypeDictionary } = require('ucom-libs-social-transactions');

const { PublicationsApi } = require('ucom-libs-wallet').Content;
const { EventsIds } = require('ucom.libs.common').Events.Dictionary;
const { EntityNames } = require('ucom.libs.common').Common.Dictionary;


const moment = require('moment');

const ActivityGroupDictionary   = require('../../../../lib/activity/activity-group-dictionary');

let userVlad: UserModel;
let userJane: UserModel;

const JEST_TIMEOUT = 15000;
// @ts-ignore
const JEST_TIMEOUT_DEBUG = JEST_TIMEOUT * 100;

describe('Create/update direct post and push content to the blockchain', () => {
  beforeAll(async () => {
    await SeedsHelper.noGraphQlNoMocking();
  });
  afterAll(async () => {
    await SeedsHelper.afterAllWithoutGraphQlNoConnectionsKill();
  });
  beforeEach(async () => {
    [userVlad, userJane] = await SeedsHelper.beforeAllRoutine();
  });

  describe('Direct post creation with a transaction', () => {
    it('create direct post for user providing a transaction', async () => {
      const postContent: StringToAnyCollection = {
        description:    'Our super post description',
        entity_images:  {},
        entity_tags:    ['winter', 'summer'],
      };

      const { signed_transaction, blockchain_id } = await PublicationsApi.signCreateDirectPostForAccount(
        userVlad.account_name,
        userVlad.private_key,
        userJane.account_name,
        postContent,
      );

      const requestContent: StringToAnyCollection = {
        ...postContent,
        signed_transaction,
        blockchain_id,
      };

      const post = await PostsGenerator.createDirectPostForUser(
        userVlad,
        userJane,
        requestContent,
      );

      expect(post.blockchain_id).toBe(blockchain_id);

      const eventId = NotificationsEventIdDictionary.getUserCreatesDirectPostForOtherUser();

      const activity = await knex(UsersModelProvider.getUsersActivityTableName())
        .where({
          activity_type_id:   ContentTypeDictionary.getTypeDirectPost(),
          activity_group_id:  ActivityGroupDictionary.getGroupContentCreation(),
          user_id_from:       userVlad.id,
          entity_id_to:       post.id,
          entity_name:        EntityNames.POSTS,
          event_id:           eventId,
          entity_id_on:       userJane.id,
          entity_name_on:     EntityNames.USERS,
        });

      CommonChecker.expectOnlyOneNotEmptyItem(activity);

      await UsersActivityCommonHelper.getProcessedActivity(userVlad.id, eventId);
    }, JEST_TIMEOUT);

    it('create direct post from organization providing a transaction', async () => {
      const organization: OrgModel = await OrganizationsGenerator.createOrgWithoutTeamAndGetModel(userJane);

      const postContent: StringToAnyCollection = {
        description:    'Our super post description',
        entity_images:  {},
        entity_tags:    ['winter', 'summer'],
      };

      const { signed_transaction, blockchain_id } = await PublicationsApi.signCreateDirectPostForOrganization(
        userVlad.account_name,
        organization.blockchain_id,
        userVlad.private_key,
        postContent,
      );

      const requestContent: StringToAnyCollection = {
        ...postContent,
        signed_transaction,
        blockchain_id,
      };

      const post = await PostsGenerator.createDirectPostForOrganization(
        userVlad,
        organization.id,
        requestContent,
      );

      expect(post.blockchain_id).toBe(blockchain_id);

      const eventId = NotificationsEventIdDictionary.getUserCreatesDirectPostForOrg();

      const activity = await knex(UsersModelProvider.getUsersActivityTableName())
        .where({
          activity_type_id:   ContentTypeDictionary.getTypeDirectPost(),
          activity_group_id:  ActivityGroupDictionary.getGroupContentCreation(),
          user_id_from:       userVlad.id,
          entity_id_to:       post.id,
          entity_name:        EntityNames.POSTS,
          event_id:           eventId,
          entity_id_on:       organization.id,
          entity_name_on:     EntityNames.ORGANIZATIONS,
        });

      CommonChecker.expectOnlyOneNotEmptyItem(activity);

      await UsersActivityCommonHelper.getProcessedActivity(userVlad.id, eventId);
    }, JEST_TIMEOUT);
  });

  describe('Direct post updating with a transaction', () => {
    it('update direct post from user providing a transaction', async () => {
      const postBefore: PostModel = await PostsGenerator.createDirectPostForUser(userVlad, userJane);

      const content = {
        description:    'Changed description',
        entity_images: '{}',

        blockchain_id:  postBefore.blockchain_id,
        created_at:     moment(postBefore.created_at).utc().format(),
      };

      const signed_transaction = await PublicationsApi.signUpdateDirectPostForAccount(
        userVlad.account_name,
        userVlad.private_key,
        userJane.account_name,
        content,
        postBefore.blockchain_id,
      );

      const fields = {
        description: content.description,
        signed_transaction,
      };

      const postAfter: PostModel = await PostsHelper.updatePost(
        postBefore.id,
        userVlad,
        fields,
      );

      expect(postAfter.blockchain_id).toBe(postBefore.blockchain_id);

      const eventId = EventsIds.userUpdatesDirectPostForUser();

      const activity = await knex(UsersModelProvider.getUsersActivityTableName())
        .where({
          activity_type_id:   ContentTypeDictionary.getTypeDirectPost(),
          activity_group_id:  ActivityGroupDictionary.getGroupContentUpdating(),
          user_id_from:       userVlad.id,
          entity_id_to:       postAfter.id,
          entity_name:        EntityNames.POSTS,
          event_id:           eventId,

          entity_id_on:       userJane.id,
          entity_name_on:     EntityNames.USERS,
        });

      CommonChecker.expectOnlyOneNotEmptyItem(activity);

      await UsersActivityCommonHelper.getProcessedActivity(userVlad.id, eventId);
    }, JEST_TIMEOUT);

    it('update direct post from organization providing a transaction', async () => {
      const organization: OrgModel = await OrganizationsGenerator.createOrgWithoutTeamAndGetModel(userJane);

      const postBefore: PostModel = await PostsGenerator.createDirectPostForOrganization(userVlad, organization.id);

      const content = {
        description:    'Changed description',
        entity_images: '{}',

        blockchain_id:  postBefore.blockchain_id,
        created_at:     moment(postBefore.created_at).utc().format(),
      };

      const signed_transaction = await PublicationsApi.signUpdateDirectPostForOrganization(
        userVlad.account_name,
        userVlad.private_key,
        organization.blockchain_id,
        content,
        postBefore.blockchain_id,
      );

      const fields = {
        description: content.description,
        signed_transaction,
      };

      const postAfter: PostModel = await PostsHelper.updatePost(
        postBefore.id,
        userVlad,
        fields,
      );

      expect(postAfter.blockchain_id).toBe(postBefore.blockchain_id);

      const eventId = EventsIds.userUpdatesDirectPostForOrganization();

      const activity = await knex(UsersModelProvider.getUsersActivityTableName())
        .where({
          activity_type_id:   ContentTypeDictionary.getTypeDirectPost(),
          activity_group_id:  ActivityGroupDictionary.getGroupContentUpdating(),
          user_id_from:       userVlad.id,
          entity_id_to:       postAfter.id,
          entity_name:        EntityNames.POSTS,
          event_id:           eventId,

          entity_id_on:       organization.id,
          entity_name_on:     EntityNames.ORGANIZATIONS,
        });

      CommonChecker.expectOnlyOneNotEmptyItem(activity);

      await UsersActivityCommonHelper.getProcessedActivity(userVlad.id, eventId);
    }, JEST_TIMEOUT);
  });
});

export {};
