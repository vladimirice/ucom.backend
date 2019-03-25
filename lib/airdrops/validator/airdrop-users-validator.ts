import { AppError } from '../../api/errors';

class AirdropUsersValidator {
  public static checkTokensConsistency(airdropTokens, userTokens): void {
    if (airdropTokens.length !== userTokens.length) {
      throw new AppError(
        `Airdrop tokens and userTokens have different length. Airdrop tokens: ${JSON.stringify(airdropTokens)}, userTokens: ${JSON.stringify(userTokens)}`,
        500,
      );
    }

    for (const expectedToken of airdropTokens) {
      const userToken = userTokens.some(item => item.symbol === expectedToken.symbol);

      if (!userToken) {
        throw new AppError(
          `There is no token of symbol ${expectedToken.symbol} in userTokens. Airdrop tokens: ${JSON.stringify(airdropTokens)}, userTokens: ${JSON.stringify(userTokens)}`,
          500,
        );
      }
    }
  }
}

export = AirdropUsersValidator;
