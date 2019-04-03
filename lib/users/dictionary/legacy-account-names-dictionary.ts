import EnvHelper = require('../../common/helper/env-helper');

const accountNames = [
  'spirin',
  'sudokey',
  'karolinaer',
  'test',
  'ilya',
  'katyac',
  'jane',
  'romanov',
  'vlad',
  'anzor',
  'sergeis',
];

class LegacyAccountNamesDictionary {
  public static isAccountNameLegacy(accountName: string): boolean {
    if (EnvHelper.isProductionEnv()) {
      return false;
    }

    return !!~accountNames.indexOf(accountName);
  }
}

export = LegacyAccountNamesDictionary;
