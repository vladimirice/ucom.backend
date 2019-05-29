import responseHelper from '../../integration/helpers/response-helper';
import OffersModel = require('../../../lib/affiliates/models/offers-model');
import { UserModel } from '../../../lib/users/interfaces/model-interfaces';

const request = require('supertest');
const { app:server } = require('../../../lib/affiliates/applications/redirect-application');

const { CommonHeaders } = require('ucom.libs.common').Common.Dictionary;

class RedirectRequest {
  public static async makeRedirectRequest(
    offer: OffersModel,
    user: UserModel,
    uniqueIdJwtToken: string | null = null,
  ) {
    const url: string = `/${offer.hash}/${user.account_name}`;

    const req = request(server)
      .get(url)
    ;

    if (uniqueIdJwtToken) {
      req
        .set('Cookie', [`${CommonHeaders.UNIQUE_ID}=${uniqueIdJwtToken}`])
    }

    const res = await req;
    responseHelper.expectStatusTempRedirect(res);

    return res;
  }
}

export = RedirectRequest;
