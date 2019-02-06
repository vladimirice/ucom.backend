import { UserModel } from '../../../lib/users/interfaces/model-interfaces';

import EntityTagsGenerator = require('../../generators/entity/entity-tags-generator');

import SeedsHelper = require('../helpers/seeds-helper');

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
      it('Get many tags order by id DESC', async () => {
        const tagsAmount = 20;

        await EntityTagsGenerator.createTagsViaNewPostsByAmount(userVlad, tagsAmount);
      });
    });
  });
});

export {};
