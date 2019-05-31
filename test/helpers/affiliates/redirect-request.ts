import responseHelper from '../../integration/helpers/response-helper';
import StreamsModel = require('../../../lib/affiliates/models/streams-model');
import { UserModel } from '../../../lib/users/interfaces/model-interfaces';
import OffersModel = require('../../../lib/affiliates/models/offers-model');
import RedirectChecker = require('./redirect-checker');
import RequestHelper = require('../../integration/helpers/request-helper');
import AffiliatesCommonHelper = require('./affiliates-common-helper');

const supertest = require('supertest');
const { app:server } = require('../../../lib/affiliates/applications/redirect-application');
const config = require('config');

class RedirectRequest {
  public static async makeRedirectRequest(
    streamOwner: UserModel,
    offer: OffersModel,
    givenUniqueId: string | null = null,
  ): Promise<{response: any, uniqueId: string}> {

    const stream: StreamsModel = await StreamsModel.query().findOne({
      user_id:  streamOwner.id,
      offer_id: offer.id
    });

    const url = stream.redirect_url.replace(config.servers.redirect, '');

    const request = supertest(server)
      .get(url)
    ;

    if (givenUniqueId) {
      RequestHelper.addCookies(request, [
        AffiliatesCommonHelper.composeUniqueIdCookieString(givenUniqueId),
      ]);
    }

    const response = await request;
    responseHelper.expectStatusTempRedirect(response);

    const uniqueIdFromResponse = RedirectChecker.checkUniqueIdCookieAndGetUniqueId(response);

    if (givenUniqueId) {
      expect(uniqueIdFromResponse).toBe(givenUniqueId);
    }

    return {
      response,
      uniqueId: uniqueIdFromResponse,
    };
  }
}

export = RedirectRequest;
