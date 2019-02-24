import { EntityJobExecutorService } from '../../../lib/stats/service/entity-job-executor-service';
import { UserModel } from '../../../lib/users/interfaces/model-interfaces';
import { EntityEventRepository } from '../../../lib/stats/repository/entity-event-repository';
import { EntityEventParamDto } from '../../../lib/stats/interfaces/model-interfaces';

import SeedsHelper = require('../helpers/seeds-helper');
import PostsHelper = require('../helpers/posts-helper');

import OrganizationsHelper = require('../helpers/organizations-helper');
import OrganizationsGenerator = require('../../generators/organizations-generator');
import _ = require('lodash');
import EntityTagsGenerator = require('../../generators/entity/entity-tags-generator');
import TagsRepository = require('../../../lib/tags/repository/tags-repository');
import EventParamTypeDictionary = require('../../../lib/stats/dictionary/event-param/event-param-type-dictionary');
import TagsModelProvider = require('../../../lib/tags/service/tags-model-provider');
import PostsModelProvider = require('../../../lib/posts/service/posts-model-provider');
import OrganizationsModelProvider = require('../../../lib/organizations/service/organizations-model-provider');

let userVlad: UserModel;

const beforeAfterOptions = {
  isGraphQl: false,
  workersMocking: 'blockchainOnly',
};

// #task - these are is unit tests
describe('Stats services', () => {
  beforeAll(async () => { await SeedsHelper.beforeAllSetting(beforeAfterOptions); });
  afterAll(async () => { await SeedsHelper.doAfterAll(beforeAfterOptions); });
  beforeEach(async () => {
    [userVlad] = await SeedsHelper.beforeAllRoutine();
  });

  it('Check importance calculation for all of entities at once', async () => {
    const batchSize = 2;
    const entitiesAmount = 4;

    const postsIds =
      await EntityTagsGenerator.createTagsViaNewPostsByAmount(userVlad, entitiesAmount);

    const postToImportance  = await PostsHelper.setRandomRateToManyPosts(postsIds);

    const orgIds =
      await OrganizationsGenerator.createManyOrgWithoutTeam(userVlad, entitiesAmount);
    const zeroImportanceOrgId = await OrganizationsGenerator.createOrgWithoutTeam(userVlad);

    const orgToImportance = await OrganizationsHelper.setRandomRateToManyOrgs(orgIds);
    orgToImportance[zeroImportanceOrgId] = 0;

    const zeroRatePostId = await EntityTagsGenerator.createTagViaNewPost(userVlad, 'summer');
    postToImportance[zeroRatePostId] = 0;

    const tags = await TagsRepository.getAllTags();
    const tagToImportance = {};

    tags.forEach((tag) => {
      tagToImportance[+tag.id] = +tag.current_rate;
    });

    await EntityJobExecutorService.processEntityEventParam(batchSize);

    const postEvents: EntityEventParamDto[] =
      await EntityEventRepository.findManyEventsWithPostEntityName();
    expect(_.isEmpty(postEvents)).toBeFalsy();
    expect(postEvents.length).toBe(Object.keys(postToImportance).length);

    postEvents.forEach((event) => {
      const value = postToImportance[+event.entity_id];
      expect(+event.json_value.data.importance).toBe(value);
      expect(event.entity_name).toBe(PostsModelProvider.getEntityName());
      expect(event.event_type).toBe(EventParamTypeDictionary.getCurrentBlockchainImportance());
    });

    const orgEvents: EntityEventParamDto[] =
      await EntityEventRepository.findManyEventsWithOrgEntityName();
    expect(_.isEmpty(orgEvents)).toBeFalsy();
    expect(orgEvents.length).toBe(Object.keys(orgToImportance).length);

    orgEvents.forEach((event) => {
      const value = orgToImportance[+event.entity_id];
      expect(+event.json_value.data.importance).toBe(value);
      expect(event.entity_name).toBe(OrganizationsModelProvider.getEntityName());
      expect(event.event_type).toBe(EventParamTypeDictionary.getCurrentBlockchainImportance());
    });

    const tagsEvents: EntityEventParamDto[] =
      await EntityEventRepository.findManyEventsWithTagEntityName(
        EventParamTypeDictionary.getTagItselfCurrentAmounts(),
      );
    expect(_.isEmpty(tagsEvents)).toBeFalsy();
    expect(tagsEvents.length).toBe(Object.keys(tagToImportance).length);

    tagsEvents.forEach((event) => {
      const value = tagToImportance[+event.entity_id];
      expect(+event.json_value.data.importance).toBe(value);
      expect(event.entity_name).toBe(TagsModelProvider.getEntityName());
      expect(event.event_type).toBe(EventParamTypeDictionary.getTagItselfCurrentAmounts());
    });
  });
});

export {};
