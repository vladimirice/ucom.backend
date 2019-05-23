import { AirdropDebtDto, OneUserAirdropDto } from '../../lib/airdrops/interfaces/dto-interfaces';
import { GraphqlHelper } from '../integration/helpers/graphql-helper';

import _ = require('lodash');
import AirdropsTokensRepository = require('../../lib/airdrops/repository/airdrops-tokens-repository');
import AccountsSymbolsRepository = require('../../lib/accounts/repository/accounts-symbols-repository');
import AccountTypesDictionary = require('../../lib/accounts/dictionary/account-types-dictionary');
import AirdropsUsersRepository = require('../../lib/airdrops/repository/airdrops-users-repository');
import ResponseHelper = require('../integration/helpers/response-helper');
import AccountsTransactionsRepository = require('../../lib/accounts/repository/accounts-transactions-repository');
import { IAirdrop } from '../../lib/airdrops/interfaces/model-interfaces';
import { UserModel } from '../../lib/users/interfaces/model-interfaces';
import { StringToAnyCollection } from '../../lib/common/interfaces/common-types';

const { AirdropStatuses } = require('ucom.libs.common').Airdrop.Dictionary;

const githubAirdropGuestState = {
  airdrop_id: 1,
  user_id: null, // null only if airdrop_status = new
  score: 0,
  airdrop_status: AirdropStatuses.NEW, // new
  conditions: {
    auth_github: false,
    auth_myself: false,
    following_devExchange: false,
  },
  tokens: [
    {
      amount_claim: 0,
      symbol: 'UOSTEST',
    },
    {
      amount_claim: 0,
      symbol: 'GHTEST',
    },
  ],
};

const githubAirdropNoParticipationState = {
  airdrop_id: 1,
  score: 0,
  airdrop_status: AirdropStatuses.NO_PARTICIPATION,
  tokens: [
    {
      amount_claim: 0,
      symbol: 'UOSTEST',
    },
    {
      amount_claim: 0,
      symbol: 'GHTEST',
    },
  ],
};

class AirdropsUsersChecker {
  public static checkGithubAirdropNoParticipationState(actual: OneUserAirdropDto, airdropId: number): void {
    const data = _.cloneDeep(githubAirdropNoParticipationState);
    data.airdrop_id = airdropId;

    expect(actual).toMatchObject(githubAirdropNoParticipationState);
  }

  public static async checkReservedToWaitingTransfer(
    userId: number,
    airdropId: number,
    stateBefore: any,
  ): Promise<void> {
    const stateAfter =
      await AirdropsUsersRepository.getAllAirdropsUsersDataByUserId(userId, airdropId);

    for (const itemAfter of stateAfter) {
      const itemBefore = stateBefore.find(item => item.reserved_symbol_id === itemAfter.reserved_symbol_id);
      ResponseHelper.expectNotEmpty(itemBefore);

      expect(+itemAfter.reserved.current_balance).toBe(0);
      expect(+itemAfter.waiting.current_balance).toBeGreaterThan(0);
      expect(+itemBefore.reserved.current_balance).toBeGreaterThan(0);

      expect(+itemAfter.waiting.current_balance).toBe(+itemBefore.reserved.current_balance);

      expect(itemBefore.status).toBe(AirdropStatuses.PENDING);
      expect(itemAfter.status).toBe(AirdropStatuses.WAITING);

      const waitingTrx = await AccountsTransactionsRepository.findOneById(+itemAfter.waiting.last_transaction_id);
      ResponseHelper.expectNotEmpty(waitingTrx.external_tr_id);
    }
  }

  public static async checkWaitingToWalletTransfer(
    userId: number,
    airdropId: number,
    stateBefore: any,
  ): Promise<void> {
    const stateAfter =
      await AirdropsUsersRepository.getAllAirdropsUsersDataByUserId(userId, airdropId);

    for (const itemAfter of stateAfter) {
      const itemBefore = stateBefore.find(item => item.reserved_symbol_id === itemAfter.reserved_symbol_id);
      ResponseHelper.expectNotEmpty(itemBefore);

      expect(+itemAfter.reserved.current_balance).toBe(0);
      expect(+itemAfter.waiting.current_balance).toBe(0);
      expect(+itemAfter.wallet.current_balance).toBeGreaterThan(0);
      expect(+itemBefore.waiting.current_balance).toBeGreaterThan(0);

      expect(+itemAfter.wallet.current_balance).toBe(+itemBefore.waiting.current_balance);

      expect(itemBefore.status).toBe(AirdropStatuses.WAITING);
      expect(itemAfter.status).toBe(AirdropStatuses.RECEIVED);
    }
  }

  public static async checkThatNoUserTokens(airdropId: number, userId: number): Promise<void> {
    const data = await AirdropsUsersRepository.getAllOfAirdropForOneUser(airdropId, userId);
    expect(data.length).toBe(0);
  }

  public static async checkGithubAirdropToPendingState(
    airdrop: IAirdrop,
    user: UserModel,
    postId: number,
    userAirdropData: StringToAnyCollection,
  ) {
    const userVladState = await AirdropsUsersRepository.getAllAirdropsUsersDataByUserId(user.id, airdrop.id);
    expect(userVladState.length).toBe(2);

    const postOffer = await GraphqlHelper.getOnePostOfferWithoutUser(postId, airdrop.id);
    const manyAirdropDebts: AirdropDebtDto[] = await AirdropsTokensRepository.getAirdropsAccountDataById(airdrop.id);

    const titleToSymbolId = await AccountsSymbolsRepository.findAllAccountsSymbolsIndexedByTitle();

    const result: any = {};
    for (const vladExpectedToken of userAirdropData.tokens) {
      const expected = {
        status: AirdropStatuses.PENDING,
        reserved: {
          account_type:       AccountTypesDictionary.reserved(),
          current_balance:    `${vladExpectedToken.amount_claim * (10 ** 4)}`,
          symbol_id:          titleToSymbolId[vladExpectedToken.symbol],
          user_id:            user.id,
        },
        waiting: {
          account_type:       AccountTypesDictionary.waiting(),
          current_balance:    '0',
          symbol_id:          titleToSymbolId[vladExpectedToken.symbol],
          user_id:            user.id,
          last_transaction_id: null,
        },
        wallet: {
          account_type:       AccountTypesDictionary.wallet(),
          current_balance:    '0',
          symbol_id:          titleToSymbolId[vladExpectedToken.symbol],
          user_id:            user.id,
          last_transaction_id: null,
        },
      };

      const actual = userVladState.find(item => item.reserved_symbol_id === titleToSymbolId[vladExpectedToken.symbol]);
      expect(_.isEmpty(actual)).toBeFalsy();
      expect(actual.status).toBe(expected.status);

      expect(actual.reserved).toMatchObject(expected.reserved);
      expect(+actual.reserved.last_transaction_id).toBeGreaterThan(0);

      const postOfferToken = postOffer.offer_data.tokens.find(item => item.symbol === vladExpectedToken.symbol);
      expect(_.isEmpty(postOfferToken)).toBeFalsy();

      const debt = manyAirdropDebts.find(item => item.symbol === postOfferToken.symbol);
      expect(_.isEmpty(debt)).toBeFalsy();

      expect(actual.waiting).toMatchObject(expected.waiting);
      expect(actual.wallet).toMatchObject(expected.wallet);
    }

    return result;
  }

  public static checkGithubAirdropState(actual: OneUserAirdropDto, expected): void {
    expect(actual.airdrop_id).toBe(expected.airdrop_id);

    expect(actual.score).toBe(expected.score);
    expect(actual.tokens).toMatchObject(expected.tokens);
  }

  public static checkGithubAirdropGuestState(actual: OneUserAirdropDto, airdropId: number): void {
    expect(actual).toMatchObject(this.getGuestState(airdropId));
  }

  public static checkGithubAirdropNoTokensState(actual: OneUserAirdropDto, userId: number, airdropId: number): void {
    expect(actual).toMatchObject(this.getNoTokensState(userId, airdropId));
  }

  public static checkAirdropsStructure(actual): void {
    expect(actual).toBeDefined();

    expect(typeof actual.airdrop_id).toBe('number');
    expect(actual.airdrop_id).toBeGreaterThan(0);

    expect(actual.user_id).toBeDefined();

    expect(typeof actual.score).toBe('number');
    expect(actual.score).toBeGreaterThanOrEqual(0);

    expect(typeof actual.airdrop_status).toBe('number');
    expect(actual.airdrop_status).toBeGreaterThanOrEqual(1);

    expect(_.isEmpty(actual.conditions)).toBeFalsy();

    expect(typeof actual.conditions.auth_github).toBe('boolean');
    expect(typeof actual.conditions.auth_myself).toBe('boolean');
    expect(typeof actual.conditions.following_devExchange).toBe('boolean');

    expect(Array.isArray(actual.tokens)).toBeTruthy();
    expect(actual.tokens.length).toBe(2);
  }

  private static getNoTokensState(userId: number, airdropId: number) {
    const data = _.cloneDeep(githubAirdropGuestState);

    // @ts-ignore
    data.user_id = userId;
    data.conditions.auth_myself = true;
    data.airdrop_id = airdropId;

    return data;
  }

  private static getGuestState(airdropId: number) {
    const data = githubAirdropGuestState;

    data.airdrop_id = airdropId;

    return data;
  }
}

export = AirdropsUsersChecker;
