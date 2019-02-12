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
import TagsCurrentRateProcessor = require('../../../lib/tags/service/tags-current-rate-processor');

let userVlad: UserModel;
let userJane: UserModel;

const beforeAfterOptions = {
  isGraphQl: false,
  workersMocking: 'blockchainOnly',
};

// #task - these are is unit tests
describe('Stats services', () => {
  beforeAll(async () => { await SeedsHelper.beforeAllSetting(beforeAfterOptions); });
  afterAll(async () => { await SeedsHelper.doAfterAll(beforeAfterOptions); });
  beforeEach(async () => {
    [userVlad, userJane] = await SeedsHelper.beforeAllRoutine();
  });

  it('check post types amounts for tags', async () => {
    const batchSize = 2;

    const tagOneTitle   = 'summer';
    const tagTwoTitle   = 'autumn';
    const tagThreeTitle = 'winter';

    await Promise.all([
      EntityTagsGenerator.createTagViaNewPost(userVlad, tagOneTitle),
      EntityTagsGenerator.createTagViaNewPost(userVlad, tagOneTitle),
      EntityTagsGenerator.createTagViaNewDirectPost(userVlad, userJane, tagOneTitle),

      EntityTagsGenerator.createTagViaNewPost(userVlad, tagTwoTitle),

      EntityTagsGenerator.createTagViaNewDirectPost(userJane, userVlad, tagThreeTitle),
    ]);

    await TagsCurrentRateProcessor.process();

    await EntityJobExecutorService.processEntityEventParam(batchSize);

    const events: EntityEventParamDto[] =
      await EntityEventRepository.findManyEventsWithTagEntityName(
        EventParamTypeDictionary.getTagItselfCurrentAmounts(),
      );

    expect(_.isEmpty(events)).toBeFalsy();

    expect(events.length).toBe(3);

    const [tagOneModel, tagTwoModel, tagThreeModel] = await Promise.all([
      TagsRepository.findOneByTitle(tagOneTitle),
      TagsRepository.findOneByTitle(tagTwoTitle),
      TagsRepository.findOneByTitle(tagThreeTitle),
    ]);

    const firstEvent  = events.find(item => +item.entity_id === tagOneModel!.id)!;
    const secondEvent = events.find(item => +item.entity_id === tagTwoModel!.id)!;
    const thirdEvent  = events.find(item => +item.entity_id === tagThreeModel!.id)!;

    expect(+firstEvent.json_value.data.current_media_posts_amount).toBe(2);
    expect(+firstEvent.json_value.data.current_direct_posts_amount).toBe(1);
    expect(+firstEvent.json_value.data.current_posts_amount).toBe(3);

    expect(+secondEvent.json_value.data.current_media_posts_amount).toBe(1);
    expect(+secondEvent.json_value.data.current_direct_posts_amount).toBe(0);
    expect(+secondEvent.json_value.data.current_posts_amount).toBe(1);

    expect(+thirdEvent.json_value.data.current_media_posts_amount).toBe(0);
    expect(+thirdEvent.json_value.data.current_direct_posts_amount).toBe(1);
    expect(+thirdEvent.json_value.data.current_posts_amount).toBe(1);
  });

  it('create and check two events for different entities.', async () => {
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
      await EntityEventRepository.findManyEventsWithTagEntityName();
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
