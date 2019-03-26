"use strict";
const errors_1 = require("../../api/errors");
class AirdropUsersValidator {
    static checkTokensConsistency(airdropTokens, userTokens) {
        if (airdropTokens.length !== userTokens.length) {
            throw new errors_1.AppError(`Airdrop tokens and userTokens have different length. Airdrop tokens: ${JSON.stringify(airdropTokens)}, userTokens: ${JSON.stringify(userTokens)}`, 500);
        }
        for (const expectedToken of airdropTokens) {
            const userToken = userTokens.some(item => item.symbol === expectedToken.symbol);
            if (!userToken) {
                throw new errors_1.AppError(`There is no token of symbol ${expectedToken.symbol} in userTokens. Airdrop tokens: ${JSON.stringify(airdropTokens)}, userTokens: ${JSON.stringify(userTokens)}`, 500);
            }
        }
    }
}
module.exports = AirdropUsersValidator;
