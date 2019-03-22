const { AirdropStatuses } = require('ucom.libs.common').Airdrop.Dictionary;

import AirdropsUsersExternalDataService = require('../../../lib/airdrops/service/airdrops-users-external-data-service');

class AirdropsUsersGenerator {
  public static getExpectedUserAirdrop(
    airdropId: number,
    usersExternalId: number,
    conditions: any,
    userId: number | null = null,
  ) {
    const commonData = AirdropsUsersExternalDataService.getUserAirdropCommonData(airdropId, usersExternalId, false);

    return {
      user_id: userId,
      airdrop_status: AirdropStatuses.NEW,
      conditions,

      ...commonData,
    };
  }
}

export = AirdropsUsersGenerator;
