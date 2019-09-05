import { ContentTypesDictionary } from 'ucom.libs.common';
import { UserModel } from '../../../../lib/users/interfaces/model-interfaces';
import { StringToAnyCollection } from '../../../../lib/common/interfaces/common-types';
import { PostModel } from '../../../../lib/posts/interfaces/model-interfaces';

import SeedsHelper = require('../../helpers/seeds-helper');
import PostsGenerator = require('../../../generators/posts-generator');
import knex = require('../../../../config/knex');
import UsersModelProvider = require('../../../../lib/users/users-model-provider');
import CommonChecker = require('../../../helpers/common/common-checker');
import UsersActivityCommonHelper = require('../../../helpers/users/activity/users-activity-common-helper');
import NotificationsEventIdDictionary = require('../../../../lib/entities/dictionary/notifications-event-id-dictionary');
import RepostResendingService = require('../../../../lib/posts/service/content-resending/repost-resending-service');

const { PublicationsApi } = require('ucom-libs-wallet').Content;
const { EntityNames } = require('ucom.libs.common').Common.Dictionary;

const ActivityGroupDictionary   = require('../../../../lib/activity/activity-group-dictionary');

let userVlad: UserModel;
let userJane: UserModel;

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
  [userVlad, userJane] = await SeedsHelper.beforeAllRoutine();
});

it('create direct post for user providing a transaction', async () => {
  const post: PostModel = await PostsGenerator.createMediaPostByUserHimselfAndGetModel(userJane);

  const postContent: StringToAnyCollection = {
    description:    'Repost creation description #winter #summer',
    entity_images:  {},
    entity_tags:    ['winter', 'summer'],
    parent_id:      post.id,
  };

  const { signed_transaction, blockchain_id } = await PublicationsApi.signCreateRepostPostForAccount(
    userVlad.account_name,
    userVlad.private_key,
    post.blockchain_id,
    postContent,
  );

  const requestContent: StringToAnyCollection = {
    ...postContent,
    signed_transaction,
    blockchain_id,
  };

  const repost = await PostsGenerator.createRepostAndGetModel(userVlad, post.id, requestContent);

  expect(repost.blockchain_id).toBe(blockchain_id);

  const eventId = NotificationsEventIdDictionary.getUserRepostsOtherUserPost();

  const activity = await knex(UsersModelProvider.getUsersActivityTableName())
    .where({
      activity_type_id:   ContentTypesDictionary.getTypeRepost(),
      activity_group_id:  ActivityGroupDictionary.getGroupContentCreation(),
      user_id_from:       userVlad.id,
      entity_id_to:       repost.id,
      entity_name:        EntityNames.POSTS,
      event_id:           eventId,
      entity_id_on:       post.id,
      entity_name_on:     EntityNames.POSTS,
    });

  CommonChecker.expectOnlyOneNotEmptyItem(activity);

  await UsersActivityCommonHelper.getProcessedActivity(userVlad.id, eventId);
}, JEST_TIMEOUT);

it.skip('Resend direct posts for org', async () => {
  await PostsGenerator.createUserPostAndRepost(userJane, userVlad);

  const createdAt = '2019-11-11 00:00:00';

  await RepostResendingService.resendReposts(createdAt, 1, true, 0);
}, JEST_TIMEOUT_DEBUG);

export {};
