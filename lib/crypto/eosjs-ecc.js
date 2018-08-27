const ecc = require('eosjs-ecc');

const prefixEos = 'EOS';

class EosJsEcc {
  static sign(data, privateKey) {
    return ecc.sign(data, privateKey);
  }

  static verify(signature, data, publicKey) {
    return ecc.verify(signature, data, EosJsEcc._getEosPrefixedPublicKey(publicKey));
  }

  static isValidPublic(publicKey) {
    return ecc.isValidPublic(EosJsEcc._getEosPrefixedPublicKey(publicKey));
  }

  static _getEosPrefixedPublicKey(publicKey) {
    // It is required because lib works only with EOS prefixed keys
    return prefixEos + publicKey.slice(3);
  }
}

module.exports = EosJsEcc;
