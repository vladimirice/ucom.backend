import { BadRequestError, getErrorMessagePair } from '../api/errors';

const ecc = require('eosjs-ecc');

const prefixEos = 'EOS';

class EosJsEcc {
  static sign(data, privateKey) {
    return ecc.sign(data, privateKey);
  }

  static verify(signature, data, publicKey) {
    return ecc.verify(signature, data, EosJsEcc.getEosPrefixedPublicKey(publicKey));
  }

  public static verifySignatureOrCommonError(signature: string, accountName: string, publicKey: string): void {
    try {
      const verified = EosJsEcc.verify(signature, accountName, publicKey);

      if (!verified) {
        // noinspection ExceptionCaughtLocallyJS
        throw new BadRequestError('error');
      }
    } catch (error) {
      throw new BadRequestError(getErrorMessagePair('account_name', 'Incorrect Brainkey or Account name or one of the private keys'));
    }
  }

  static isValidPublic(publicKey) {
    return ecc.isValidPublic(EosJsEcc.getEosPrefixedPublicKey(publicKey));
  }

  public static isValidPublicOrError(publicKey: string): void {
    if (!ecc.isValidPublic(publicKey)) {
      throw new BadRequestError(getErrorMessagePair('account_name', `Provided public key is not valid: ${publicKey}`));
    }
  }

  private static getEosPrefixedPublicKey(publicKey) {
    // It is required because lib works only with EOS prefixed keys
    return prefixEos + publicKey.slice(3);
  }
}

export = EosJsEcc;
