const uniqid = require('uniqid');

class BlockchainUniqId {

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