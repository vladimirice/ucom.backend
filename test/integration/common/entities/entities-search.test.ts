import { GraphqlHelper } from '../../helpers/graphql-helper';

import SeedsHelper = require('../../helpers/seeds-helper');
import EntityEventParamGeneratorV2 = require('../../../generators/entity/entity-event-param-generator-v2');
import CommonChecker = require('../../../helpers/common/common-checker');

const JEST_TIMEOUT = 5000;

const options = {
  isGraphQl: true,
  workersMocking: 'blockchainOnly',
};

beforeAll(async () => { await SeedsHelper.beforeAllSetting(options); });
afterAll(async () => { await SeedsHelper.doAfterAll(options); });
beforeEach(async () => {
  await SeedsHelper.beforeAllRoutineMockAccountsProperties();
});

it('search for many entities', async () => {
  const searchPattern = 'e';

  await EntityEventParamGeneratorV2.createAndProcessManyEventsForManyEntities();

  const response = await GraphqlHelper.getManyEntitiesBySearchPattern(searchPattern);

  CommonChecker.expectNotEmpty(response.many_tags);
  CommonChecker.expectNotEmpty(response.many_tags.data);

  CommonChecker.expectManyEntitiesMatchSearchPattern(
    response.many_tags.data,
    searchPattern,
    [
      'title',
    ],
  );

  CommonChecker.expectManyEntitiesMatchSearchPattern(
    response.many_organizations.data,
    searchPattern,
    [
      'title',
      'nickname',
    ],
  );

  CommonChecker.expectManyEntitiesMatchSearchPattern(
    response.many_users.data,
    searchPattern,
    [
      'account_name',
      'first_name',
      'last_name',
    ],
  );
}, JEST_TIMEOUT);

export {};
