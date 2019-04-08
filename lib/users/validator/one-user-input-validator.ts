import LegacyAccountNamesDictionary = require('../dictionary/legacy-account-names-dictionary');

class OneUserInputValidator {
  public static doesIdentityLooksLikeAccountName(incomingValue: string): boolean {
    return incomingValue.length === 12
      || LegacyAccountNamesDictionary.isAccountNameLegacy(incomingValue);
  }
}

export = OneUserInputValidator;
