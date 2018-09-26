const uniqid = require('uniqid');

const prefixByScope = {
  'organizations': 'org'
};


class BlockchainUniqId {
  /**
   *
   * @param {string} scope
   * @return {string}
   */
  static getUniqidByScope(scope) {
    const prefix = prefixByScope[scope];
    if (!prefix) {
      throw new Error(`Scope ${scope} is not supported`);
    }

    return this.getUniqIdWithoutId(prefix);
  }

  /**
   *
   * @param {number} id - model ID
   * @param {string} prefix - model type prefix
   * @returns {string}
   */
  static getUniqId(id, prefix) {
    return uniqid(`${prefix}${id}-`);
  }

  /**
   *
   * @param {string} prefix
   * @return {*}
   */
  static getUniqIdWithoutId(prefix) {
    return uniqid(`${prefix}-`);
  }
}

module.exports = BlockchainUniqId;