import { IAirdrop } from '../../interfaces/model-interfaces';
import { CurrentUserDataDto } from '../../../auth/interfaces/auth-interfaces-dto';
import { AppError } from '../../../api/errors';

import AirdropsUsersExternalDataRepository = require('../../repository/airdrops-users-external-data-repository');
import AirdropUsersService = require('../airdrop-users-service');
import AirdropsFetchRepository = require('../../repository/airdrops-fetch-repository');
import AirdropsModelProvider = require('../airdrops-model-provider');

class AirdropUsersMigrateService {
  public static async migrateFromFirstRoundToSecond(
    firstRoundAirdropId: number,
    secondRoundAirdropId: number,
  ) {
    const airdropsUsersIds: number[] =
      await AirdropsUsersExternalDataRepository.getAllAirdropUsersByAirdropId(
        firstRoundAirdropId,
        AirdropsModelProvider.getUsersExternalDataBlacklistedIds(),
      );

    if (airdropsUsersIds.length === 0) {
      throw new AppError('AirdropsUsers array for migrate must be filled');
    }

    const airdrop: IAirdrop = await AirdropsFetchRepository.getAirdropByPk(secondRoundAirdropId);

    for (const userId of airdropsUsersIds) {
      const currentUserDto: CurrentUserDataDto = {
        currentUser: {
          id: userId,
        },
        userExternal: null,
      };

      // @ts-ignore
      const userData = await AirdropUsersService.getUserAirdropData(currentUserDto, airdrop);
      const externalDataUser = await AirdropsUsersExternalDataRepository.getOneByUserIdAndAirdropId(
        userId,
        secondRoundAirdropId,
      );

      const personalStatuses = userData.score === 0 ? [10, 11, 20, 30] : [10, 11, 30];

      const toUpdate = {
        are_conditions_fulfilled: true,
        personal_statuses: personalStatuses,
      };

      await AirdropsUsersExternalDataRepository.updateOneByPrimaryKey(
        externalDataUser.primary_key,
        toUpdate,
      );
    }
  }
}

export = AirdropUsersMigrateService;
