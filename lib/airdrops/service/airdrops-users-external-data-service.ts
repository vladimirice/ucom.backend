import { currentUserDataDto, userExternalDataDto } from '../../auth/interfaces/auth-interfaces-dto';
import { AppError } from '../../api/errors';
import { AccountsSymbolsModel } from '../../accounts/interfaces/accounts-model-interfaces';
import { AirdropsUsersGithubRawItem, IAirdrop } from '../interfaces/model-interfaces';

import AirdropsUsersExternalDataRepository = require('../repository/airdrops-users-external-data-repository');
import UsersExternalRepository = require('../../users-external/repository/users-external-repository');
import AccountsSymbolsRepository = require('../../accounts/repository/accounts-symbols-repository');
import AirdropsUsersGithubRawRepository = require('../repository/airdrops-users-github-raw-repository');

import AirdropsTokensRepository = require('../repository/airdrops-tokens-repository');

const { AirdropStatuses } = require('ucom.libs.common').Airdrop.Dictionary;

class AirdropsUsersExternalDataService {
  public static async processForCurrentUserId(
    airdrop: IAirdrop,
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
      return this.createUsersExternalData(airdrop, data.primary_key, data.external_id);
    }

    throw new AppError(`Malformed response: ${JSON.stringify(data)}`, 500);
  }

  public static async processForUsersExternalId(
    airdrop: IAirdrop,
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

    return this.createUsersExternalData(
      airdrop,
      userExternalDto.id,
      userExternalDto.external_id,
    );
  }

  public static async getSampleUsersExternalData(
    airdrop: IAirdrop,
    usersExternalId: number,
    githubUserId: number,
    majorTokens: boolean = false,
  ) {
    const commonData = await this.getUserAirdropCommonData(airdrop, usersExternalId, majorTokens);

    return {
      ...commonData,
      external_user_id: githubUserId,
    };
  }

  public static async getUserAirdropCommonData(
    airdrop: IAirdrop,
    usersExternalId: number,
    majorTokens: boolean,
  ) {
    const externalData = await UsersExternalRepository.findGithubUserExternalByPkId(usersExternalId);

    if (externalData === null) {
      throw new AppError(`There is no external data with pk: ${usersExternalId}`);
    }

    const rawData: AirdropsUsersGithubRawItem | null =
      await AirdropsUsersGithubRawRepository.getScoreAndAmountByGithubId(
        +externalData.external_id,
        airdrop.conditions.source_table_name,
      );

    const resultScore = rawData === null ?
      airdrop.conditions.zero_score_incentive_tokens_amount : rawData.score;
    const resultAmount = rawData === null ?
      airdrop.conditions.zero_score_incentive_tokens_amount : rawData.amount;

    const airdropsTokens = await AirdropsTokensRepository.getAirdropsAccountDataById(airdrop.id);

    const tokensForUser: {amount_claim: number, symbol: string}[] = [];

    for (const oneToken of airdropsTokens) {
      tokensForUser.push({
        amount_claim: resultAmount,
        symbol: oneToken.symbol,
      });
    }

    const data = {
      airdrop_id: airdrop.id,
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

  private static async createUsersExternalData(
    airdrop: IAirdrop,
    usersExternalId: number,
    githubUserId: number,
  ): Promise<any> {
    const jsonData = await this.getSampleUsersExternalData(airdrop, usersExternalId, githubUserId);

    const status: number = this.getStatusByTokensForCreation(jsonData.tokens);

    await AirdropsUsersExternalDataRepository.insertOneData(
      airdrop.id,
      usersExternalId,
      jsonData.score,
      jsonData,
      status,
    );

    return {
      status,
      ...jsonData,
    };
  }

  private static getStatusByTokensForCreation(manyTokens): number {
    for (const token of manyTokens) {
      if (token.amount_claim > 0) {
        return AirdropStatuses.NEW;
      }
    }

    return AirdropStatuses.NO_PARTICIPATION;
  }
}

export = AirdropsUsersExternalDataService;
