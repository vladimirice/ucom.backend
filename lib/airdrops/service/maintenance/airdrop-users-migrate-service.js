"use strict";
const errors_1 = require("../../../api/errors");
const AirdropsUsersExternalDataRepository = require("../../repository/airdrops-users-external-data-repository");
const AirdropUsersService = require("../airdrop-users-service");
const AirdropsFetchRepository = require("../../repository/airdrops-fetch-repository");
const AirdropsModelProvider = require("../airdrops-model-provider");
class AirdropUsersMigrateService {
    static async migrateFromFirstRoundToSecond(firstRoundAirdropId, secondRoundAirdropId) {
        const airdropsUsersIds = await AirdropsUsersExternalDataRepository.getAllAirdropUsersByAirdropIdForMigration(firstRoundAirdropId, AirdropsModelProvider.getUsersExternalDataBlacklistedIds());
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
            const externalDataUser = await AirdropsUsersExternalDataRepository.getOneByUserIdAndAirdropId(userId, secondRoundAirdropId);
            const personalStatuses = userData.score === 0 ? [10, 11, 20, 30] : [10, 11, 30];
            const toUpdate = {
                are_conditions_fulfilled: true,
                personal_statuses: personalStatuses,
            };
            await AirdropsUsersExternalDataRepository.updateOneByPrimaryKey(externalDataUser.primary_key, toUpdate);
        }
    }
}
module.exports = AirdropUsersMigrateService;
