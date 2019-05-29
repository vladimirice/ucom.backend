import { UserModel } from '../../../lib/users/interfaces/model-interfaces';

import SeedsHelper = require('../helpers/seeds-helper');
import PostsGenerator = require('../../generators/posts-generator');
import StreamsModel = require('../../../lib/affiliates/models/streams-model');
import ClicksModel = require('../../../lib/affiliates/models/clicks-model');
import ConversionsModel = require('../../../lib/affiliates/models/conversions-model');
import RedirectRequest = require('../../helpers/affiliates/redirect-request');
import AffiliatesGenerator = require('./affiliates-generator');
import CommonChecker = require('../../helpers/common/common-checker');
import StreamsCreatorService = require('../../../lib/affiliates/service/streams-creator-service');
import RedirectChecker = require('../../helpers/affiliates/redirect-checker');

let userVlad: UserModel;
let userJane: UserModel;

const uniqid = require('uniqid');

const beforeAfterOptions = {
  isGraphQl: false,
  workersMocking: 'all',
};

let offer;

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

    ({offer} = await AffiliatesGenerator.createPostAndOffer(userVlad));

    await StreamsCreatorService.createRegistrationStreamsForEverybody(offer);
  });


  describe('Positive', () => {
    it('make a redirect request', async () => {
      const redirectResponse = await RedirectRequest.makeRedirectRequest(offer, userVlad);
      const uniqueId = RedirectChecker.checkUniqueIdCookieAndGetUniqueId(redirectResponse);

      const stream: StreamsModel = await StreamsModel.query().findOne({
        user_id:  userVlad.id,
        offer_id: offer.id
      });

      // TODO - a click should be created
      // TODO - a link should be correct
      const clicks: ClicksModel[] = await ClicksModel.query().where({
        offer_id:       offer.id,
        stream_id:      stream.id,
        user_unique_id: uniqueId,
      });

      CommonChecker.expectNotEmpty(clicks);
      CommonChecker.expectOnlyOneItem(clicks);
    }, JEST_TIMEOUT_DEBUG);

    it('If cookie already exists no uniqid changes should happen', async () => {
      // TODO
    }, JEST_TIMEOUT_DEBUG);
  });


  it('sample', async () => {
    // @ts-ignore
    const postId: number = await PostsGenerator.createMediaPostByUserHimself(userVlad);

    const { offer } = await AffiliatesGenerator.createPostAndOffer(userVlad);

    // @ts-ignore
    const freshStream = await StreamsModel
      .query()
      .insert({
        user_id: userVlad.id,
        account_name: userVlad.account_name,
        offer_id: offer.id,
      });

    // @ts-ignore
    const freshStream2 = await StreamsModel
      .query()
      .insert({
        user_id: userJane.id,
        account_name: userJane.account_name,
        offer_id: offer.id,
      });


    const freshClick = await ClicksModel
      .query()
      .insert({
        offer_id: offer.id,
        stream_id: freshStream.id,
        user_unique_id: uniqid(),
        json_headers: {header: 'value'},
        referer: 'https://example.com',
      });

    await ConversionsModel
      .query()
      .insert({
        offer_id: offer.id,
        stream_id: freshStream.id,
        click_id: freshClick.id,
        users_activity_id: 1,
        user_id: userVlad.id,
        status: 1,
        json_headers: {header: 'value'},
        referer: 'https://example.com',
      });


    // @ts-ignore
    const click = await ClicksModel.query().eager('[stream, offer]');


    // @ts-ignore
    const data = await StreamsModel.query().eager('offer');
    // @ts-ignore
    const conversionData = await ConversionsModel.query().eager('[offer, stream, click]');





    console.dir(conversionData);

  }, JEST_TIMEOUT_DEBUG);
});

export {};
