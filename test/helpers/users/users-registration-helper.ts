import { StringToAnyCollection } from '../../../lib/common/interfaces/common-types';

import RequestHelper = require('../../integration/helpers/request-helper');
import AffiliatesCommonHelper = require('../affiliates/affiliates-common-helper');
import ResponseHelper = require('../../integration/helpers/response-helper');

const { RegistrationApi } = require('ucom-libs-wallet');

class UsersRegistrationHelper {
  public static async registerNewUserWithRandomAccountData(
    extraFields: StringToAnyCollection = {},
    uniqueId: string | null = null,
  ) {
    const options = {
      signBySocial: true,
    };

    const accountData = RegistrationApi.generateRandomDataForRegistration(options);

    return this.registerNewUser(accountData, extraFields, uniqueId);
  }

  /**
   * @deprecated
   * @see registerNewUserWithRandomAccountData
   */
  public static async registerNewUserWithRandomAccountDataLegacy(
    extraFields: StringToAnyCollection = {},
    uniqueId: string | null = null,
  ) {
    const accountData = RegistrationApi.generateRandomDataForRegistration();

    return this.registerNewUserLegacy(accountData, extraFields, uniqueId);
  }

  private static async registerNewUserLegacy(
    accountData: any,
    extraFields: StringToAnyCollection,
    uniqueId: string | null,
  ) {
    const fields = {
      sign:           accountData.sign,
      account_name:   accountData.accountName,
      public_key:     accountData.activePublicKey,
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

  private static async registerNewUser(
    accountData: any,
    extraFields: StringToAnyCollection,
    uniqueId: string | null,
  ) {
    const fields = {
      sign:               accountData.sign,
      account_name:       accountData.accountName,
      active_public_key:  accountData.activePublicKey,
      owner_public_key:   accountData.ownerPublicKey,
      social_public_key:  accountData.socialPublicKey,

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
}

export = UsersRegistrationHelper;
