import { UserModel } from '../../../../lib/users/interfaces/model-interfaces';

import { GraphqlHelper } from '../../helpers/graphql-helper';
import { PostModelMyselfResponse } from '../../../../lib/posts/interfaces/model-interfaces';

import SeedsHelper = require('../../helpers/seeds-helper');
import PostsGenerator = require('../../../generators/posts-generator');

import UsersModelProvider = require('../../../../lib/users/users-model-provider');
import UsersHelper = require('../../helpers/users-helper');
import _ = require('lodash');
import OrganizationsGenerator = require('../../../generators/organizations-generator');
import OrganizationsModelProvider = require('../../../../lib/organizations/service/organizations-model-provider');
import OrganizationsHelper = require('../../helpers/organizations-helper');
import CommonHelper = require('../../helpers/common-helper');

let userVlad: UserModel;
let userJane: UserModel;

const JEST_TIMEOUT = 5000;

describe('#posts #direct #get #graphql', () => {
  beforeAll(async () => {
    await GraphqlHelper.beforeAll();
  });

  afterAll(async () => {
    await Promise.all([
      SeedsHelper.doAfterAll(),
      GraphqlHelper.afterAll(),
    ]);
  });

  beforeEach(async () => {
    [userVlad, userJane] = await SeedsHelper.beforeAllRoutine(true);
  });

  describe('Positive', () => {
    it('Get one direct post for user - should be related FOR info. #posts #users', async () => {
      const postId: number =
        await PostsGenerator.createDirectPostForUserAndGetId(userJane, userVlad);

      const post: PostModelMyselfResponse =
        await GraphqlHelper.getOnePostAsMyself(userVlad, postId);

      expect(post.entity_name_for).toBeDefined();
      expect(post.entity_name_for).toBe(UsersModelProvider.getEntityName());

      expect(post.entity_id_for).toBeDefined();
      expect(+post.entity_id_for).toBe(userVlad.id);

      expect(_.isEmpty(post.entity_for_card)).toBeFalsy();
      expect(post.entity_for_card.id).toBe(userVlad.id);

      UsersHelper.checkUserPreview(post.entity_for_card);

      CommonHelper.checkOnePostV2WithoutOrg(post, true, true, true);
    }, JEST_TIMEOUT);

    it('direct post should contain related wall entity info. #smoke #posts #organizations', async () => {
      const orgId: number = await OrganizationsGenerator.createOrgWithoutTeam(userVlad);
      const postId: number =
        await PostsGenerator.createDirectPostForOrganizationV2AndGetId(userVlad, orgId);

      const post: PostModelMyselfResponse =
        await GraphqlHelper.getOnePostAsMyself(userVlad, postId);

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

export {};
