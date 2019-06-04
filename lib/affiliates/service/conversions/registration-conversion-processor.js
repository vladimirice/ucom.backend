"use strict";
const ConversionsRepository = require("../../repository/conversions-repository");
const UsersActivityReferralRepository = require("../../repository/users-activity-referral-repository");
const knex = require("../../../../config/knex");
class RegistrationConversionProcessor {
    static async process() {
        const conversions = await ConversionsRepository.findSentToBlockchainToProcess();
        let totalProcessedCounter = 0;
        const totalSkippedCounter = 0;
        if (conversions.length === 0) {
            return {
                totalProcessedCounter,
                totalSkippedCounter,
            };
        }
        for (const item of conversions) {
            await this.processOneConversion(item);
            totalProcessedCounter += 1;
        }
        return {
            totalProcessedCounter,
            totalSkippedCounter,
        };
    }
    static async processOneConversion(conversionDto) {
        const doesExist = await UsersActivityReferralRepository.doesUserReferralExist(conversionDto.referral_user_id, conversionDto.source_user_id);
        if (doesExist) {
            await ConversionsRepository.setStatusDuplicateById(conversionDto.conversion_id);
            return;
        }
        await knex.transaction(async (transaction) => {
            await Promise.all([
                UsersActivityReferralRepository.insertOneUserReferral(conversionDto, transaction),
                ConversionsRepository.setStatusSuccessById(conversionDto.conversion_id, transaction),
            ]);
        });
    }
}
module.exports = RegistrationConversionProcessor;
