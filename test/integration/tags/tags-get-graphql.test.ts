import { UserModel } from '../../../lib/users/interfaces/model-interfaces';
import { GraphqlHelper } from '../helpers/graphql-helper';

import EntityTagsGenerator = require('../../generators/entity/entity-tags-generator');

import SeedsHelper = require('../helpers/seeds-helper');

import TagsHelper = require('../helpers/tags-helper');
import CommonHelper = require('../helpers/common-helper');
import TagsRepository = require('../../../lib/tags/repository/tags-repository');
import EntityEventParamGeneratorV2 = require('../../generators/entity/entity-event-param-generator-v2');
import _ = require('lodash');
import EntityListCategoryDictionary = require('../../../lib/stats/dictionary/entity-list-category-dictionary');

let userVlad: UserModel;

const JEST_TIMEOUT = 10000;

const options = {
  isGraphQl: true,
  workersMocking: 'blockchainOnly',
};

function checkTagsPage(response) {
  expect(_.isEmpty(response.data)).toBeFalsy();
  expect(_.isEmpty(response.data.many_tags)).toBeFalsy();
  expect(_.isEmpty(response.data.many_tags.data)).toBeFalsy();
  TagsHelper.checkTagsListResponseStructure(response.data.many_tags);
}

describe('GET Tags via graphql #graphql #tags', () => {
  beforeAll(async () => { await SeedsHelper.beforeAllSetting(options); });
  afterAll(async () => { await SeedsHelper.doAfterAll(options); });
  beforeEach(async () => {
    [userVlad] = await SeedsHelper.beforeAllRoutine();
  });

  describe('Get many tags ', () => {
    const usersCheckOptions = {
      author: {
        myselfData: true,
      },
    };

    describe('Trending tags', () => {
      const overviewType = EntityListCategoryDictionary.getTrending();

      it('Test trending - only test for graphql client error', async () => {
        await EntityEventParamGeneratorV2.createAndProcessManyEventsForManyEntities();
        const response = await GraphqlHelper.getManyTagsForTrending(userVlad);

        checkTagsPage(response);
      }, JEST_TIMEOUT);

      it('Users list for trending tags', async () => {
        // #task - very basic smoke test. It is required to check ordering

        const response: any = await GraphqlHelper.getTagsUsersAsMyself(
          userVlad,
          overviewType,
        );

        CommonHelper.checkUsersListResponse(response, usersCheckOptions);
      });
    });

    describe('Hot tags', () => {
      const overviewType = EntityListCategoryDictionary.getHot();

      it('Test hot - only test for graphql client error', async () => {
        await EntityEventParamGeneratorV2.createAndProcessManyEventsForManyEntities();
        const response = await GraphqlHelper.getManyTagsForHot(userVlad);

        checkTagsPage(response);
      }, JEST_TIMEOUT);

      // eslint-disable-next-line sonarjs/no-identical-functions
      it('Users list for hot tags', async () => {
        // #task - very basic smoke test. It is required to check ordering

        const response: any = await GraphqlHelper.getTagsUsersAsMyself(
          userVlad,
          overviewType,
        );

        CommonHelper.checkUsersListResponse(response, usersCheckOptions);
      });
    });

    describe('Fresh tags', () => {
      const overviewType = EntityListCategoryDictionary.getFresh();

      it('Test fresh - only test for graphql client error', async () => {
        await EntityEventParamGeneratorV2.createAndProcessManyEventsForManyEntities();
        const response = await GraphqlHelper.getManyTagsForFresh(userVlad);

        checkTagsPage(response);
      }, JEST_TIMEOUT);

      // eslint-disable-next-line sonarjs/no-identical-functions
      it('Users list for fresh tags', async () => {
        // #task - very basic smoke test. It is required to check ordering

        const response: any = await GraphqlHelper.getTagsUsersAsMyself(
          userVlad,
          overviewType,
        );

        CommonHelper.checkUsersListResponse(response, usersCheckOptions);
      });
    });

    describe('Top tags', () => {
      const overviewType = EntityListCategoryDictionary.getTop();

      it('Test top - only test for graphql client error', async () => {
        await EntityEventParamGeneratorV2.createAndProcessManyEventsForManyEntities();
        const response = await GraphqlHelper.getManyTagsForTop(userVlad);

        checkTagsPage(response);
      }, JEST_TIMEOUT);

      // eslint-disable-next-line sonarjs/no-identical-functions
      it('Users list for top tags', async () => {
        // #task - very basic smoke test. It is required to check ordering

        const response: any = await GraphqlHelper.getTagsUsersAsMyself(
          userVlad,
          overviewType,
        );

        CommonHelper.checkUsersListResponse(response, usersCheckOptions);
      });
    });

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

      it('Get many tags by myself order by id ASC and lastPage #smoke #graphql #tags', async () => {
        const tagsAmount = 20;
        const orderBy = 'id';

        await EntityTagsGenerator.createTagsViaNewPostsByAmount(userVlad, tagsAmount);

        const page = 3;
        const perPage = 8;

        const response = await GraphqlHelper.getManyTagsAsMyself(userVlad, orderBy, page, perPage);
        TagsHelper.checkTagsListResponseStructure(response);

        const expectedTagsIds: number[] =
          await TagsRepository.findManyTagsIdsWithOrderAndLimit(orderBy, perPage, page);

        CommonHelper.expectModelIdsExistenceInResponseList(response, expectedTagsIds);

        expect(response.metadata.has_more).toBeFalsy();

        const responseAmount = response.data.length;

        expect(response.data[0].id).toBe(expectedTagsIds[0]);
        expect(response.data[responseAmount - 1].id).toBe(expectedTagsIds[responseAmount - 1]);
      });

      it('Get many tags by myself order by current_rate DESC #smoke #graphql #tags', async () => {
        const tagsAmount = 20;
        const orderBy = '-current_rate,-id';

        const tagsIds =
          await EntityTagsGenerator.createTagsViaNewPostsByAmount(userVlad, tagsAmount);
        await TagsHelper.setSampleRateToTagById(tagsIds[0]);

        await Promise.all([
          TagsHelper.setSampleRateToTagById(tagsIds[2], 0.3),
          TagsHelper.setSampleRateToTagById(tagsIds[1], 0.5),
          TagsHelper.setSampleRateToTagById(tagsIds[3], 0.9),
        ]);

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

    describe('Negative', () => {
      it('Nothing is found due to exceeded pagination. #smoke #tags', async () => {
        const tagsAmount = 20;
        const orderBy = 'id';

        await EntityTagsGenerator.createTagsViaNewPostsByAmount(userVlad, tagsAmount);

        const page = 4;
        const perPage = 8;

        const response = await GraphqlHelper.getManyTagsAsMyself(userVlad, orderBy, page, perPage);
        expect(response.data.length).toBe(0);
      });
    });
  });
});

export {};
