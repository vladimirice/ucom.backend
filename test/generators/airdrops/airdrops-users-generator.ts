import AirdropsUsersExternalDataRepository = require('../../../lib/airdrops/repository/airdrops-users-external-data-repository');

class AirdropsUsersGenerator {
  public static async createSampleUsersExternalData(
    usersExternalId: number,
    githubUserId: number,
  ) {
    const jsonData = {
      error: false,
      airdrop_id: 1,
      external_user_id: githubUserId,
      score: 147399,
      tokens: [
        {
          amount: 500000,
          symbol: 'UOS',
        },
        {
          amount: 333333,
          symbol: 'FN',
        },
      ],
    };

    await AirdropsUsersExternalDataRepository.insertOneData(usersExternalId, jsonData);

    return jsonData;
  }
}

export = AirdropsUsersGenerator;
