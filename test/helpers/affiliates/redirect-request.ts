import responseHelper from '../../integration/helpers/response-helper';
import OffersModel = require('../../../lib/affiliates/models/offers-model');
import { UserModel } from '../../../lib/users/interfaces/model-interfaces';

const request = require('supertest');
const { app:server } = require('../../../lib/affiliates/applications/redirect-application');

class RedirectRequest {
  static async makeRedirectRequest(offer: OffersModel, user: UserModel) {
    const url: string = `/${offer.hash}/${user.account_name}`;

    const req = request(server)
      .get(url);

    const res = await req;
    responseHelper.expectStatusTempRedirect(res);

    return res;
  }
}

export = RedirectRequest;
