import { ConversionToProcessDto } from '../../interfaces/dto-interfaces';
import { TotalParametersResponse } from '../../../common/interfaces/response-interfaces';

import ConversionsRepository = require('../../repository/conversions-repository');
import UsersActivityReferralRepository = require('../../repository/users-activity-referral-repository');
import knex = require('../../../../config/knex');

class RegistrationConversionProcessor {
  public static async process(): Promise<TotalParametersResponse> {
    const conversions: ConversionToProcessDto[] =
      await ConversionsRepository.findSentToBlockchainToProcess();

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

  private static async processOneConversion(conversionDto: ConversionToProcessDto): Promise<void> {
    const doesExist: boolean = await UsersActivityReferralRepository.doesUserReferralExist(
      conversionDto.referral_user_id,
      conversionDto.source_user_id,
    );

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

export = RegistrationConversionProcessor;
