import { currentUserDataDto, userExternalDataDto } from '../../auth/interfaces/auth-interfaces-dto';
import { AppError } from '../../api/errors';
import { AccountsSymbolsModel } from '../../accounts/interfaces/accounts-model-interfaces';

import AirdropsUsersExternalDataRepository = require('../repository/airdrops-users-external-data-repository');
import UsersExternalRepository = require('../../users-external/repository/users-external-repository');
import AccountsSymbolsRepository = require('../../accounts/repository/accounts-symbols-repository');

class AirdropsUsersExternalDataService {
  public static async processForCurrentUserId(
    airdropId: number,
    currentUserDto: currentUserDataDto,
  ) {
    const data = await UsersExternalRepository.getUserExternalWithExternalAirdropData(currentUserDto.id);

    if (!data) {
      return null;
    }

    if (data.json_data) {
      return data.json_data;
    }

    if (data.primary_key && data.json_data === null) {
      return this.createSampleUsersExternalData(airdropId, data.primary_key, data.external_id);
    }

    throw new AppError(`Malformed response: ${JSON.stringify(data)}`, 500);
  }

  public static async processForUsersExternalId(
    airdropId: number,
    userExternalDto: userExternalDataDto,
  ) {
    let externalData =
      await AirdropsUsersExternalDataRepository.getJsonDataByUsersExternalId(userExternalDto.id);

    if (!externalData) {
      externalData = await this.createSampleUsersExternalData(
        airdropId,
        userExternalDto.id,
        userExternalDto.external_id,
      );
    }

    return externalData;
  }

  private static async createSampleUsersExternalData(
    airdropId: number,
    usersExternalId: number,
    githubUserId: number,
  ): Promise<any> {
    const jsonData = await this.getSampleUsersExternalData(airdropId, usersExternalId, githubUserId);

    await AirdropsUsersExternalDataRepository.insertOneData(airdropId, usersExternalId, jsonData.score, jsonData);

    return jsonData;
  }

  public static async getSampleUsersExternalData(
    airdropId: number,
    usersExternalId: number,
    githubUserId: number,
    majorTokens: boolean = false,
  ) {
    const commonData = await this.getUserAirdropCommonData(airdropId, usersExternalId, majorTokens);

    return {
      ...commonData,
      external_user_id: githubUserId,
    };
  }

  public static async getUserAirdropCommonData(
    airdropId: number,
    usersExternalId: number,
    majorTokens: boolean,
  ) {
    const scoreArg: number = 55 * usersExternalId;
    const tokenArg: number = 5.5 * usersExternalId;

    const data = {
      airdrop_id: airdropId,
      score: 147399 + scoreArg,
      tokens: [
        {
          amount_claim: +(50 + tokenArg).toFixed(4),
          symbol: 'UOSTEST',
        },
        {
          amount_claim: +(10 + tokenArg).toFixed(4),
          symbol: 'GHTEST',
        },
      ],
    };

    if (majorTokens) {
      return data;
    }

    const accountsSymbols: AccountsSymbolsModel[] =
      await AccountsSymbolsRepository.findAllAccountsSymbols();

    data.tokens.forEach((token) => {
      const symbol = accountsSymbols.find(item => item.title === token.symbol);

      if (!symbol) {
        throw new AppError(`There is no symbol with title: ${token.symbol}`, 500);
      }

      token.amount_claim *= 10 ** symbol.precision;
    });

    return data;
  }
}

export = AirdropsUsersExternalDataService;
