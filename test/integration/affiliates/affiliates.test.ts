import { UserModel } from '../../../lib/users/interfaces/model-interfaces';

import SeedsHelper = require('../helpers/seeds-helper');
import AirdropsUsersGenerator = require('../../generators/airdrops/airdrops-users-generator');
import PostsGenerator = require('../../generators/posts-generator');
import OffersModel = require('../../../lib/affiliates/models/offers-model');
import knex = require('../../../config/knex');

import { Model } from 'objection';
import DatetimeHelper = require('../../../lib/common/helper/datetime-helper');
import moment = require('moment');
import AffiliatesModelProvider = require('../../../lib/affiliates/service/affiliates-model-provider');
import StreamsModel = require('../../../lib/affiliates/models/streams-model');

let userVlad: UserModel;
let userJane: UserModel;

const beforeAfterOptions = {
  isGraphQl: true,
  workersMocking: 'all',
};

const JEST_TIMEOUT = 1000;
// @ts-ignore
const JEST_TIMEOUT_DEBUG = JEST_TIMEOUT * 1000;

describe('Affiliates', () => {
  beforeAll(async () => {
    await SeedsHelper.beforeAllSetting(beforeAfterOptions);
  });

  afterAll(async () => {
    await SeedsHelper.doAfterAll(beforeAfterOptions);
  });
  beforeEach(async () => {
    [userVlad, userJane] = await SeedsHelper.beforeAllRoutine();
    await AirdropsUsersGenerator.generateForVladAndJane();
    await AirdropsUsersGenerator.generateForVladAndJaneRoundTwo();
  });


  it('sample', async () => {
    const startedAt = DatetimeHelper.getMomentInUtcString(moment().add(2, 'days'));
    const finishedAt = DatetimeHelper.getMomentInUtcString(moment().add(14, 'days'));

    // @ts-ignore
    const postId: number = await PostsGenerator.createMediaPostByUserHimself(userVlad);

    // @ts-ignore
    const fresh = await knex(AffiliatesModelProvider.getOffersTableName())
      .insert({
        started_at: startedAt,
        finished_at: finishedAt,

        post_id: postId,
        status: 1,
        title: 'sample offer',
        attribution_id: 1,
        event_id: 1,
        participation_id: 1,
        url_template: 'sample_template',
      });


    Model.knex(knex);

    // @ts-ignore
    const models: OffersModel[] = await OffersModel.query();

    const first: OffersModel = models[0];

    // @ts-ignore
    const freshStream = await StreamsModel
      .query()
      .insert({
        user_id: userVlad.id,
        account_name: userVlad.account_name,
        offer_id: first.id,
      });

    // @ts-ignore
    const freshStream2 = await StreamsModel
      .query()
      .insert({
        user_id: userJane.id,
        account_name: userJane.account_name,
        offer_id: first.id,
      });

    // @ts-ignore
    const data = await StreamsModel.query().eager('offer');

  }, JEST_TIMEOUT_DEBUG);
});

export {};
