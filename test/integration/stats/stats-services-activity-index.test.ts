import { EntityEventParamDto } from '../../../lib/stats/interfaces/model-interfaces';
import { EntityEventRepository } from '../../../lib/stats/repository/entity-event-repository';

import SeedsHelper = require('../helpers/seeds-helper');
import EventParamTypeDictionary = require('../../../lib/stats/dictionary/event-param/event-param-type-dictionary');
import CommonGenerator = require('../../generators/common-generator');
import StatsHelper = require('../helpers/stats-helper');

const beforeAfterOptions = {
  isGraphQl: false,
  workersMocking: 'blockchainOnly',
};

// #task - these are is unit tests
describe('Stats services', () => {
  beforeAll(async () => { await SeedsHelper.beforeAllSetting(beforeAfterOptions); });
  afterAll(async () => { await SeedsHelper.doAfterAll(beforeAfterOptions); });
  beforeEach(async () => {
    await SeedsHelper.beforeAllRoutine();
  });

  it('check activity index for all entities together', async () => {
    const expectedSets = await CommonGenerator.createActivityDisturbance({
      posts: true,
      orgs: true,
      tags: true,
    });

    const postEvents: EntityEventParamDto[] =
      await EntityEventRepository.findManyEventsWithPostEntityName(
        EventParamTypeDictionary.getPostCurrentActivityIndex(),
      );
    StatsHelper.checkManyEventsStructure(postEvents);

    StatsHelper.checkManyEventsJsonValuesByExpectedSet(
      postEvents,
      expectedSets.expectedForPosts[EventParamTypeDictionary.getPostCurrentActivityIndex()],
    );

    const orgsEvents: EntityEventParamDto[] =
      await EntityEventRepository.findManyEventsWithOrgEntityName(
        EventParamTypeDictionary.getOrgCurrentActivityIndex(),
      );
    StatsHelper.checkManyEventsStructure(orgsEvents);
    StatsHelper.checkManyEventsJsonValuesByExpectedSet(
      orgsEvents,
      expectedSets.expectedForOrgs[EventParamTypeDictionary.getOrgCurrentActivityIndex()],
    );

    const tagsEvents: EntityEventParamDto[] =
      await EntityEventRepository.findManyEventsWithTagEntityName(
        EventParamTypeDictionary.getTagCurrentActivityIndex(),
      );
    StatsHelper.checkManyEventsStructure(tagsEvents);
    StatsHelper.checkManyEventsJsonValuesByExpectedSet(
      tagsEvents,
      expectedSets.expectedForTags[EventParamTypeDictionary.getTagCurrentActivityIndex()],
    );
  });
});

export {};
