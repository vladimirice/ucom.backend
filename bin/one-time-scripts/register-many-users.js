"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const appRoot = require('app-root-path');
const fs = require('fs');
const usersHelper = require('../../test/integration/helpers/users-helper');
const outputFile = `${appRoot}/logs/register-many-users-result.csv`;
const eosApi = require('../../lib/eos/eosApi');
eosApi.initTransactionFactory();
(async () => {
    const accountNamesToRegister = [
        'rokkyrokkyro',
    ];
    const headers = [
        'accountName',
        'brainKey',
        'privateKeyOwner',
        'publicKeyOwner',
        'privateKeyActive',
        'publicKeyActive',
    ];
    const accountsToWrite = [];
    for (let i = 0; i < accountNamesToRegister.length; i += 1) {
        const accountName = accountNamesToRegister[i];
        try {
            const { accountData } = await usersHelper.registerNewUser(accountName.toLowerCase());
            console.log(JSON.stringify(accountData));
            accountsToWrite.push(accountData);
        }
        catch (e) {
            console.error(
            // tslint:disable-next-line:max-line-length
            `Not possible to register user with account name ${accountName}. Skipped. Error message is: ${e.message}`);
        }
    }
    objectsToCsv(accountsToWrite, headers);
})();
/**
 *
 * @param {Object[]} accountsData
 * @param {string[]|null} headers
 */
function objectsToCsv(accountsData, headers = null) {
    let outputString = '';
    if (headers) {
        outputString += headers.join(';');
        outputString += '\n';
    }
    for (let i = 0; i < accountsData.length; i += 1) {
        const data = accountsData[i];
        const processedData = [];
        for (const field in data) {
            // noinspection JSUnfilteredForInLoop
            processedData.push(`"${data[field]}"`);
        }
        outputString += processedData.join(';');
        outputString += '\n';
    }
    fs.writeFileSync(outputFile, outputString);
    console.log(`results are saved to: ${outputFile}`);
}
