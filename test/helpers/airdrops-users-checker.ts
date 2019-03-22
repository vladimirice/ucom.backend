import { OneUserAirdropDto } from '../../lib/airdrops/interfaces/dto-interfaces';

import _ = require('lodash');

const githubAirdropGuestState = {
  airdrop_id: 1,
  user_id: null, // null only if airdrop_status = new
  score: 0,
  airdrop_status: 1, // new
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

class AirdropsUsersChecker {
  public static checkGithubAirdropState(actual: OneUserAirdropDto, expected): void {
    expect(actual.airdrop_id).toBe(expected.airdrop_id);

    expect(actual.score).toBe(expected.score);
    expect(actual.tokens).toMatchObject(expected.tokens);
  }

  public static checkGithubAirdropGuestState(actual: OneUserAirdropDto): void {
    expect(actual).toMatchObject(this.getGuestState());
  }

  public static checkGithubAirdropNoTokensState(actual: OneUserAirdropDto, userId: number): void {
    expect(actual).toMatchObject(this.getNoTokensState(userId));
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

  private static getNoTokensState(userId: number) {
    const data = _.cloneDeep(githubAirdropGuestState);

    // @ts-ignore
    data.user_id = userId;
    data.conditions.auth_myself = true;

    return data;
  }

  private static getGuestState() {
    return githubAirdropGuestState;
  }
}

export = AirdropsUsersChecker;
