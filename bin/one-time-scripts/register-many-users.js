const appRoot = require('app-root-path');
const fs      = require('fs');

UsersHelper = require('../../test/integration/helpers/users-helper');
const outputFile = `${appRoot}/logs/register-many-users-result.csv`;

const EosApi = require('../../lib/eos/eosApi');
EosApi.initTransactionFactory();

(async () => {
  const accountNamesToRegister = [
    'Uaidhearthin',
    'Uaidhelburgy',
    'Uaincharahid',
    'Uaithclifiel',
    'Ualappollian',
    'Uanorodrifin',
    'Uarturaliony',
    'Uchaireanond',
    'Uchebightoth',
    'Uchesfirilie',
    'Uchtencandur',
    'Uchursandyce',
    'Udafirridith',
    'Udaguenicele',
    'Uducemenrico',
    'Uduwalcumhal',
    'Uederuffuddy',
    'Ueporganinus',
    'Ueporigirien',
    'Ueporkaupman',
    'Ueporoninoth',
    'Ueportimagun',
    'Ueqoricourse',
    'Uhtregwynfys',
    'Uialypatrigh',
    'Uibhnerothra',
    'Uilewenkella',
    'Uillewiduthe',
    'Uillicerbert',
    'Uilliptheses',
    'Uirchervicca',
    'Uislinikelli',
    'Uisnarbhirth',
    'Uissoscardol',
    'Ulbergaladur',
    'Ulcarpittarl',
    'Ulfalkelbert',
    'Ulgallemanni',
    'Uliobeleraid',
    'Ulishaurenia',
    'Ulmorgirimur',
    'Ulricheelies',
    'Ulsonsuendir',
    'Ultenefrelif',
    'Ultersothiel',
    'Ulvegioriath',
    'Ulveriarlena',
    'Ulvermelvynn',
    'Ulwaraglorix',
    'Ulwealaridet',
    'Umailcheredy',
    'Umbasborotto',
    'Umquamaborga',
    'Unfeandorlei',
    'Ungarenaelsy',
    'Unginogenyth',
    'Ungolasteith',
    'Ungorgentine',
    'Unguartholly',
    'Ungunduatrin',
    'Unicermichel',
    'Unphearnagor',
    'Unphegalraic',
    'Unpiesenthet',
    'Untedraumbas',
    'Unwanefinneu',
    'Upponkellenn',
    'Uptadianorig',
    'Upwodeglinda',
    'Upwodenishaw',
    'Urathmanisor',
    'Urbaithernod',
    'Urfaidhellah',
    'Urfelinnifer',
    'Uriencalvynn',
    'Urienessoset',
    'Urindorterix',
    'Urinevrouges',
    'Urthgellenan',
    'Urthurferdis',
    'Uruiliwynley',
    'Urutharidiun',
    'Urutinduhink',
    'Usalnibergil',
    'Uskippinerid',
    'Uslaketilden',
    'Usnaeluinhil',
    'Usnaignedheh',
    'Uthleistedis',
    'Uthwoldelbet',
    'Uttanishalad',
    'Uttesifinnis',
    'Uttesisburga',
    'Uttocniventa',
    'Uttorridliag',
    'Uuolofarrank',
    'Uzandubharth',
    'Urinaldebern',
    'Urissobertur',
    'Urlouchtacus',
    'Urminetberci',
    'Urusgaladhna',
    'Urutheraphon',
    'Uskutaterbel',
    'Uthianothrin',
    'Uthmasorrant',
    'Uttelegelsey',
    'Uwairfindura',
    'Ulverovannay',
    'Umileahthrus',
    'Unadannannis',
    'Ungolvagdaes',
    'Unphegalence',
    'Unwalmadelee',
    'Unwingazrald',
    'Urabaymunzel',
    'Urbelatillon',
    'Urberlastiny',
    'Urfaibalismo',
    'Urfellaiglin',
    'Urgaladiccus',
    'Uialyvevalen',
    'Uianbertinya',
    'Uigseannenad',
    'Uilestusalay',
    'Uilleseibias',
    'Uilorinewulf',
    'Uirgaconters',
    'Uirithenthas',
    'Ulfedenbaude',
    'Ulmichidhede',
    'Ulteleckiney',
    'Ultenthrorda',
    'Ulteristeite',
    'Uaigrimurant',
    'Uaillistaney',
    'Uaitlynnessa',
    'Ualastildora',
    'Ucelethianse',
    'Uchamwoltone',
    'Uchelmonchon',
    'Uchraniordan',
    'Uchtailmaell',
    'Uchtgittorid',
    'Udulfhelagor',
    'Uialliffanus',
    'Uldeiciliona',
    'Unnoggodgare',
    'Unwicherilyn',
    'Unwinerothet',
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
