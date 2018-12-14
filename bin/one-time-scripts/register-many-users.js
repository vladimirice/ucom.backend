const appRoot = require('app-root-path');
const fs      = require('fs');

UsersHelper = require('../../test/integration/helpers/users-helper');
const outputFile = `${appRoot}/logs/register-many-users-result.csv`;

const EosApi = require('../../lib/eos/eosApi');
EosApi.initTransactionFactory();

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
  for (let i = 0; i < accountNamesToRegister.length; i++) {
    const accountName = accountNamesToRegister[i];

    try {
      const { accountData } = await UsersHelper.registerNewUser(accountName.toLowerCase());
      console.log(JSON.stringify(accountData));
      accountsToWrite.push(accountData);
    } catch (e) {
      console.error(`Not possible to register user with account name ${accountName}. Skipped. Error message is: ${e.message}`);
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

  for (let i = 0; i < accountsData.length; i++) {
    const data = accountsData[i];

    const processedData = [];
    for (const field in data) {
      processedData.push(`"${data[field]}"`);
    }

    outputString += processedData.join(';');
    outputString += '\n';
  }

  fs.writeFileSync(outputFile, outputString);

  console.log(`results are saved to: ${outputFile}`);
}



// (async () => {
// const accountsData = [
//   {
//     accountName: 'accountName_sample_1',
//     brainKey: 'brainkey_sample_1',
//     privateKeyOwner: 'sample_private_key_owner_1',
//     publicKeyOwner: 'sample_public_key_owner_1',
//
//     privateKeyActive: 'sample_private_key_active_1',
//     publicKeyActive: 'sample_public_key_active_1',
//   },
//   {
//     accountName: 'accountName_sample_2',
//     brainKey: 'brainkey_sample_2',
//     privateKeyOwner: 'sample_private_key_owner_2',
//     publicKeyOwner: 'sample_public_key_owner_2',
//
//     privateKeyActive: 'sample_private_key_active_2',
//     publicKeyActive: 'sample_public_key_active_2',
//   },
// ];
// objectsToCsv(accountsData, headers);
// })();
