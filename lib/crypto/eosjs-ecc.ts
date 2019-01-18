const ecc = require('eosjs-ecc');

const prefixEos = 'EOS';

class EosJsEcc {
  static sign(data, privateKey) {
    return ecc.sign(data, privateKey);
  }

  static verify(signature, data, publicKey) {
    return ecc.verify(signature, data, EosJsEcc.getEosPrefixedPublicKey(publicKey));
  }

  static isValidPublic(publicKey) {
    return ecc.isValidPublic(EosJsEcc.getEosPrefixedPublicKey(publicKey));
  }

  private static getEosPrefixedPublicKey(publicKey) {
    // It is required because lib works only with EOS prefixed keys
    return prefixEos + publicKey.slice(3);
  }
}

export = EosJsEcc;
