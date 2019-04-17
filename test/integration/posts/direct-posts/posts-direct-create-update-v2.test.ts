import { PostModelResponse } from '../../../../lib/posts/interfaces/model-interfaces';
import { UserModel } from '../../../../lib/users/interfaces/model-interfaces';

const _ = require('lodash');

import SeedsHelper = require('../../helpers/seeds-helper');
import CommonHelper = require('../../helpers/common-helper');
import PostsGenerator = require('../../../generators/posts-generator');
import PostsHelper = require('../../helpers/posts-helper');
import UsersModelProvider = require('../../../../lib/users/users-model-provider');
import OrganizationsGenerator = require('../../../generators/organizations-generator');
import OrganizationsModelProvider = require('../../../../lib/organizations/service/organizations-model-provider');

import OrganizationsHelper = require('../../helpers/organizations-helper');
import UsersHelper = require('../../helpers/users-helper');
import PostsCurrentParamsRepository = require('../../../../lib/posts/repository/posts-current-params-repository');

const JEST_TIMEOUT = 5000;

let userVlad: UserModel;
let userJane: UserModel;

describe('Direct posts create-update v2', () => {
  beforeEach(async () => {
    [userVlad, userJane] = await SeedsHelper.beforeAllRoutine(true);
  });

  afterAll(async () => {
    await SeedsHelper.sequelizeAfterAll();
  });

  describe('Direct post creation v2', () => {
    it('Post current params row should be created during direct post creation', async () => {
      const postId = await PostsGenerator.createDirectPostForUserAndGetId(userVlad, userJane);

      const data = await PostsCurrentParamsRepository.getCurrentStatsByEntityId(postId);

      PostsHelper.checkOneNewPostCurrentParams(data, true);
    });

    it('Direct post of org - current params row should be created during direct post creation', async () => {
      const orgId = await OrganizationsGenerator.createOrgWithoutTeam(userVlad);
      const postId = await PostsGenerator.createDirectPostForOrganizationV2AndGetId(userVlad, orgId);

      const data = await PostsCurrentParamsRepository.getCurrentStatsByEntityId(postId);

      PostsHelper.checkOneNewPostCurrentParams(data, true);
    });

    it('Create direct post for user without organization', async () => {
      const user = userVlad;
      const targetUser = userJane;

      const newPostFields: any = {
        description: 'Our super post description',
      };

      const expected = {
        entity_id_for:    `${targetUser.id}`,
        entity_name_for:  UsersModelProvider.getEntityName(),
      };

      const post = await PostsGenerator.createUserDirectPostForOtherUserV2(
        user,
        targetUser,
        newPostFields.description,
      );

      const options = {
        myselfData: true,
        postProcessing: 'full',
        allowEmptyComments: true,
      };

      await CommonHelper.checkOnePostV2(post, options);

      await CommonHelper.checkDirectPostInDb(post, {
        ...expected,
        ...newPostFields,
      },                                       user);
    });

    it('Create direct post for organization', async () => {
      const user = userVlad;

      const targetOrgId: number = await OrganizationsGenerator.createOrgWithoutTeam(userVlad);

      const newPostFields: any = {
        description: 'Our super post description',
      };

      const expected = {
        entity_id_for:    `${targetOrgId}`,
        entity_name_for:  OrganizationsModelProvider.getEntityName(),
      };

      const post = await PostsGenerator.createDirectPostForOrganizationV2(
        userVlad,
        targetOrgId,
        newPostFields.description,
      );

      const options = {
        myselfData: true,
        postProcessing: 'full',
        allowEmptyComments: true,
      };

      await CommonHelper.checkOnePostV2(post, options);

      await CommonHelper.checkDirectPostInDb(post, {
        ...expected,
        ...newPostFields,
      },                                       user);
    });
  });

  describe('Direct post updating v2', () => {
    it('Update direct post for user without organization', async () => {
      const user        = userVlad;
      const targetUser  = userJane;

      const expectedValues = {
        description: 'changed sample description of direct post',
      };

      const postBefore  =
        await PostsGenerator.createUserDirectPostForOtherUserV2(user, targetUser);
      const postAfter   = await PostsHelper.requestToUpdatePostDescriptionV2(
        postBefore.id,
        user,
        expectedValues.description,
      );

      const options = {
        myselfData: true,
        postProcessing: 'full',
        skipCommentsChecking: true,
      };

      expect(postAfter.comments).not.toBeDefined();


      await CommonHelper.checkOnePostForPage(postAfter, options);
      await CommonHelper.checkDirectPostInDb(postAfter, expectedValues, userVlad);
    });

    describe('Direct post creation response', () => {
      it('Response of direct post for user should contain related wall info. #smoke #posts #users', async () => {
        const post: PostModelResponse =
          await PostsGenerator.createUserDirectPostForOtherUserV2(userJane, userVlad);

        expect(post.entity_name_for).toBeDefined();
        expect(post.entity_name_for).toBe(UsersModelProvider.getEntityName());

        expect(post.entity_id_for).toBeDefined();
        expect(+post.entity_id_for).toBe(userVlad.id);

        expect(_.isEmpty(post.entity_for_card)).toBeFalsy();
        expect(post.entity_for_card.id).toBe(userVlad.id);

        UsersHelper.checkUserPreview(post.entity_for_card);
      }, JEST_TIMEOUT);

      it('direct post should contain related wall entity info. #smoke #posts #organizations', async () => {
        const orgId: number = await OrganizationsGenerator.createOrgWithoutTeam(userVlad);
        const post: PostModelResponse =
          await PostsGenerator.createDirectPostForOrganizationV2(userVlad, orgId);

        expect(post.entity_name_for).toBeDefined();
        expect(post.entity_name_for).toBe(OrganizationsModelProvider.getEntityName());

        expect(post.entity_id_for).toBeDefined();
        expect(+post.entity_id_for).toBe(orgId);

        expect(_.isEmpty(post.entity_for_card)).toBeFalsy();

        OrganizationsHelper.checkOneOrganizationCardStructure(post.entity_for_card);
        expect(post.entity_for_card.id).toBe(orgId);
      }, JEST_TIMEOUT);
    });
  });
});

export {};
