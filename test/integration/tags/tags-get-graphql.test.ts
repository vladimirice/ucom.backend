import { UserModel } from '../../../lib/users/interfaces/model-interfaces';
import { GraphqlHelper } from '../helpers/graphql-helper';

import EntityTagsGenerator = require('../../generators/entity/entity-tags-generator');

import SeedsHelper = require('../helpers/seeds-helper');

import TagsHelper = require('../helpers/tags-helper');
import CommonHelper = require('../helpers/common-helper');
import TagsRepository = require('../../../lib/tags/repository/tags-repository');

let userVlad: UserModel;

const options = {
  isGraphQl: true,
  workersMocking: 'blockchainOnly',
};

describe('GET Tags via graphql #graphql #tags', () => {
  beforeAll(async () => { await SeedsHelper.beforeAllSetting(options); });
  afterAll(async () => { await SeedsHelper.doAfterAll(options); });
  beforeEach(async () => {
    [userVlad] = await SeedsHelper.beforeAllRoutine();
  });

  describe('Get many tags ', () => {
    describe('Positive', () => {
      it('Get many tags by myself order by id DESC #smoke #graphql #tags', async () => {
        const tagsAmount = 20;
        const orderBy = '-id';

        await EntityTagsGenerator.createTagsViaNewPostsByAmount(userVlad, tagsAmount);

        const perPage = 8;

        const response = await GraphqlHelper.getManyTagsAsMyself(userVlad, orderBy, 1, perPage);
        TagsHelper.checkTagsListResponseStructure(response);

        const expectedTagsIds: number[] =
          await TagsRepository.findManyTagsIdsWithOrderAndLimit(orderBy, perPage);

        CommonHelper.expectModelIdsExistenceInResponseList(response, expectedTagsIds);

        expect(response.data[0].id).toBe(expectedTagsIds[0]);
        expect(response.data[perPage - 1].id).toBe(expectedTagsIds[perPage - 1]);
      });

      it('Get many tags by myself order by id ASC #smoke #graphql #tags', async () => {
        const tagsAmount = 20;
        const orderBy = 'id';

        await EntityTagsGenerator.createTagsViaNewPostsByAmount(userVlad, tagsAmount);

        const perPage = 8;

        const response = await GraphqlHelper.getManyTagsAsMyself(userVlad, orderBy, 1, perPage);
        TagsHelper.checkTagsListResponseStructure(response);

        const expectedTagsIds: number[] =
          await TagsRepository.findManyTagsIdsWithOrderAndLimit(orderBy, perPage);

        CommonHelper.expectModelIdsExistenceInResponseList(response, expectedTagsIds);

        expect(response.data[0].id).toBe(expectedTagsIds[0]);
        expect(response.data[perPage - 1].id).toBe(expectedTagsIds[perPage - 1]);
      });

      it('Get many tags as guest #smoke #graphql #tags', async () => {
        const tagsAmount = 20;
        const orderBy = '-id';

        await EntityTagsGenerator.createTagsViaNewPostsByAmount(userVlad, tagsAmount);

        const perPage = 8;

        const response = await GraphqlHelper.getManyTagsAsGuest(orderBy, 1, perPage);
        TagsHelper.checkTagsListResponseStructure(response);

        const expectedTagsIds: number[] =
          await TagsRepository.findManyTagsIdsWithOrderAndLimit(orderBy, perPage);

        CommonHelper.expectModelIdsExistenceInResponseList(response, expectedTagsIds);

        expect(response.data[0].id).toBe(expectedTagsIds[0]);
        expect(response.data[perPage - 1].id).toBe(expectedTagsIds[perPage - 1]);
      });
    });
  });
});

export {};
