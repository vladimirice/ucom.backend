import { StringToAnyCollection } from '../../../lib/common/interfaces/common-types';

import EosApi = require('../../../lib/eos/eosApi');
import EosJsEcc = require('../../../lib/crypto/eosjs-ecc');
import RequestHelper = require('../../integration/helpers/request-helper');
import AffiliatesCommonHelper = require('../affiliates/affiliates-common-helper');
import ResponseHelper = require('../../integration/helpers/response-helper');

class UsersRegistrationHelper {
  public static async registerNewUserWithRandomAccountData(
    extraFields: StringToAnyCollection = {},
    uniqueId: string | null = null,
  ) {
    const accountData = this.generateRandomAccount();

    return this.registerNewUser(accountData, extraFields, uniqueId);
  }

  private static async registerNewUser(
    accountData: any,
    extraFields: StringToAnyCollection,
    uniqueId: string | null,
  ) {
    const fields = {
      sign:           accountData.sign,
      account_name:   accountData.accountName,
      public_key:     accountData.publicActiveKey,
      brainkey:       accountData.brainKey,

      ...extraFields,
    };

    const url = RequestHelper.getRegistrationRoute();

    const request = RequestHelper.getRequestObjForPost(url);
    if (uniqueId) {
      RequestHelper.addCookies(request, [
        AffiliatesCommonHelper.composeUniqueIdCookieString(uniqueId),
      ]);
    }

    RequestHelper.addFieldsToRequest(request, fields);

    const response = await request;

    ResponseHelper.expectStatusCreated(response);

    return {
      body: response.body,
      accountData,
    };
  }

  private static generateRandomAccount(): {
    accountName: string,

    brainKey: string,

    privateOwnerKey: string,
    publicOwnerKey: string,

    privateActiveKey: string,
    publicActiveKey: string

    sign: string,
    } {
    const brainKey = EosApi.generateBrainkey();

    const [privateOwnerKey, privateActiveKey] = EosApi.getKeysByBrainkey(brainKey);

    const publicOwnerKey  = EosApi.getPublicKeyByPrivate(privateOwnerKey);
    const publicActiveKey = EosApi.getPublicKeyByPrivate(privateActiveKey);

    const accountName = EosApi.createRandomAccountName();

    const sign = EosJsEcc.sign(accountName, privateActiveKey);

    return {
      accountName,

      brainKey,

      privateOwnerKey,
      publicOwnerKey,

      privateActiveKey,
      publicActiveKey,

      sign,
    };
  }
}

export = UsersRegistrationHelper;
