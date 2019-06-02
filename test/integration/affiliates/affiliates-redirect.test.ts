import { UserModel } from '../../../lib/users/interfaces/model-interfaces';

import SeedsHelper = require('../helpers/seeds-helper');
import StreamsModel = require('../../../lib/affiliates/models/streams-model');
import ClicksModel = require('../../../lib/affiliates/models/clicks-model');
import RedirectRequest = require('../../helpers/affiliates/redirect-request');
import CommonChecker = require('../../helpers/common/common-checker');
import StreamsCreatorService = require('../../../lib/affiliates/service/streams-creator-service');
import AffiliatesGenerator = require('../../generators/affiliates/affiliates-generator');

let userVlad: UserModel;
let userJane: UserModel;

const beforeAfterOptions = {
  isGraphQl: false,
  workersMocking: 'all',
};

const JEST_TIMEOUT = 1000;
// @ts-ignore
const JEST_TIMEOUT_DEBUG = JEST_TIMEOUT * 1000;

describe('Affiliates', () => {
  let offer;

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
    it('make a redirect request for the newcomer', async () => {
      const { response, uniqueId } = await RedirectRequest.makeRedirectRequest(userVlad, offer);
      const stream: StreamsModel = await StreamsModel.query().findOne({
        user_id:  userVlad.id,
        offer_id: offer.id
      });

      expect(response.header.location).toBe(stream.redirect_url);

      const clicks: ClicksModel[] = await ClicksModel.query().where({
        offer_id:       offer.id,
        stream_id:      stream.id,
        user_unique_id: uniqueId,
      });

      CommonChecker.expectNotEmpty(clicks);
      CommonChecker.expectOnlyOneNotEmptyItem(clicks);
      expect(clicks[0].user_unique_id).toBe(uniqueId);
    }, JEST_TIMEOUT);

    it('If cookie already exists no uniqid changes should happen', async () => {
      const { uniqueId } = await RedirectRequest.makeRedirectRequest(userVlad, offer);

      await RedirectRequest.makeRedirectRequest(userVlad, offer, uniqueId);
      await RedirectRequest.makeRedirectRequest(userJane, offer, uniqueId);

      const clicks: ClicksModel[] = await ClicksModel.query().where({
        offer_id:       offer.id,
        user_unique_id: uniqueId,
      });

      CommonChecker.expectNotEmpty(clicks);

      expect(clicks.length).toBe(3);

      for (const oneClick of clicks) {
        expect(oneClick.user_unique_id).toBe(uniqueId);
      }
    }, JEST_TIMEOUT);

    it('Two different users are redirected - two cookies are created, uniqueIds are different', async () => {
      const { uniqueId:firstUniqueId } = await RedirectRequest.makeRedirectRequest(userVlad, offer);
      const { uniqueId:secondUniqueId } = await RedirectRequest.makeRedirectRequest(userVlad, offer);

      expect(firstUniqueId).not.toBe(secondUniqueId);

      await RedirectRequest.makeRedirectRequest(userVlad, offer, firstUniqueId);
      await RedirectRequest.makeRedirectRequest(userJane, offer, secondUniqueId);

      const firstUniqueIdClicks: ClicksModel[] = await ClicksModel.query().where({
        offer_id:       offer.id,
        user_unique_id: firstUniqueId,
      });

      expect(firstUniqueIdClicks.length).toBe(2);

      const secondUniqueIdClicks: ClicksModel[] = await ClicksModel.query().where({
        offer_id:       offer.id,
        user_unique_id: secondUniqueId,
      });

      expect(secondUniqueIdClicks.length).toBe(2);

      for (const first of firstUniqueIdClicks) {
        const second = secondUniqueIdClicks.find(item => item.id === first.id);
        CommonChecker.expectEmpty(second);
      }

    }, JEST_TIMEOUT_DEBUG);
  });
});

export {};
