"use strict";
const errors_1 = require("../../../api/errors");
const AirdropsUsersExternalDataRepository = require("../../repository/airdrops-users-external-data-repository");
const EnvHelper = require("../../../common/helper/env-helper");
const AirdropUsersService = require("../airdrop-users-service");
const AirdropsFetchRepository = require("../../repository/airdrops-fetch-repository");
class AirdropUsersMigrateService {
    static async migrateFromFirstRoundToSecond(firstRoundAirdropId, secondRoundAirdropId) {
        const airdropsUsersIds = await AirdropsUsersExternalDataRepository.getAllAirdropUsersByAirdropId(firstRoundAirdropId, this.getUsersExternalDataBlacklistedIds());
        if (airdropsUsersIds.length === 0) {
            throw new errors_1.AppError('AirdropsUsers array for migrate must be filled');
        }
        const airdrop = await AirdropsFetchRepository.getAirdropByPk(secondRoundAirdropId);
        for (const userId of airdropsUsersIds) {
            const currentUserDto = {
                currentUser: {
                    id: userId,
                },
                userExternal: null,
            };
            // @ts-ignore
            const userData = await AirdropUsersService.getUserAirdropData(currentUserDto, airdrop);
            /*
            // TODO
            * process personal_statuses
                * IF score is zero THEN {10, 11, 20, 30}
                * ELSE {10, 11, 30}
            Note: in the future a pending worker will process them appropriately
             */
        }
    }
    static getUsersExternalDataBlacklistedIds() {
        if (EnvHelper.isStagingEnv()) {
            return [1, 2, 25, 3, 4, 12, 13, 20, 22, 23, 27, 28, 29, 32, 33, 36, 39, 45, 42, 49, 43, 46, 44, 47, 53, 52, 51, 54, 56, 57, 66, 59, 60, 61, 68, 64, 65, 69, 70, 76, 75, 78, 80];
        }
        return [];
    }
}
module.exports = AirdropUsersMigrateService;
