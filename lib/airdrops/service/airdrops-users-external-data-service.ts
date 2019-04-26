import { currentUserDataDto, userExternalDataDto } from '../../auth/interfaces/auth-interfaces-dto';
import { AppError } from '../../api/errors';
import { AccountsSymbolsModel } from '../../accounts/interfaces/accounts-model-interfaces';
import { AirdropsUsersGithubRawItem } from '../interfaces/model-interfaces';

import AirdropsUsersExternalDataRepository = require('../repository/airdrops-users-external-data-repository');
import UsersExternalRepository = require('../../users-external/repository/users-external-repository');
import AccountsSymbolsRepository = require('../../accounts/repository/accounts-symbols-repository');
import AirdropsUsersGithubRawRepository = require('../repository/airdrops-users-github-raw-repository');

import AirdropsTokensRepository = require('../repository/airdrops-tokens-repository');

const { AirdropStatuses } = require('ucom.libs.common').Airdrop.Dictionary;

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
      return  {
        ...data.json_data,
        status: data.status,
      };
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
    const externalData =
      await AirdropsUsersExternalDataRepository.getOneByUsersExternalId(userExternalDto.id);

    if (externalData) {
      return {
        ...externalData.json_data,
        status: externalData.status,
      };
    }

    return this.createSampleUsersExternalData(
      airdropId,
      userExternalDto.id,
      userExternalDto.external_id,
    );
  }

  private static async createSampleUsersExternalData(
    airdropId: number,
    usersExternalId: number,
    githubUserId: number,
  ): Promise<any> {
    const jsonData = await this.getSampleUsersExternalData(airdropId, usersExternalId, githubUserId);

    await AirdropsUsersExternalDataRepository.insertOneData(airdropId, usersExternalId, jsonData.score, jsonData);

    return {
      ...jsonData,
      status: AirdropStatuses.NEW,
    };
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
    const externalData = await UsersExternalRepository.findGithubUserExternalByPkId(usersExternalId);

    if (externalData === null) {
      throw new AppError(`There is no external data with pk: ${usersExternalId}`);
    }

    const rawData: AirdropsUsersGithubRawItem | null =
      await AirdropsUsersGithubRawRepository.getScoreAndAmountByGithubId(+externalData.external_id);

    const resultScore = rawData === null ? 0 : rawData.score;
    const resultAmount = rawData === null ? 0 : rawData.amount;

    const airdropsTokens = await AirdropsTokensRepository.getAirdropsAccountDataById(airdropId);

    const tokensForUser: {amount_claim: number, symbol: string}[] = [];

    for (const oneToken of airdropsTokens) {
      tokensForUser.push({
        amount_claim: resultAmount,
        symbol: oneToken.symbol,
      });
    }

    const data = {
      airdrop_id: airdropId,
      score: resultScore,
      tokens: tokensForUser,
    };

    if (!majorTokens) {
      return data;
    }

    const accountsSymbols: AccountsSymbolsModel[] =
      await AccountsSymbolsRepository.findAllAccountsSymbols();

    data.tokens.forEach((token) => {
      const symbol = accountsSymbols.find(item => item.title === token.symbol);

      if (!symbol) {
        throw new AppError(`There is no symbol with title: ${token.symbol}`, 500);
      }

      token.amount_claim /= 10 ** symbol.precision;
    });

    return data;
  }
}

export = AirdropsUsersExternalDataService;
