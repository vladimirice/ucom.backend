const uniqid = require('uniqid');
const PostsModelProvider = require('../posts/service/posts-model-provider');

const MEDIA_POST_PREFIX   = PostsModelProvider.getMediaPostBlockchainIdPrefix();
const POST_OFFER_PREFIX   = PostsModelProvider.getPostOfferBlockchainIdPrefix();

const prefixByScope = {
  'organizations': 'org',
};

class BlockchainUniqId {
  /**
   *
   * @return {string}
   */
  static getUniqidForMediaPost() {
    return this.getUniqIdWithoutId(MEDIA_POST_PREFIX);
  }

  /**
   *
   * @return {string}
   */
  static getUniqidForPostOffer() {
    return this.getUniqIdWithoutId(POST_OFFER_PREFIX);
  }

  /**
   *
   * @return {string}
   */
  static getUniqidForDirectPost() {
    const prefix = PostsModelProvider.getDirectPostBlockchainIdPrefix();

    return this.getUniqIdWithoutId(prefix);
  }

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
   * @param {string} prefix
   * @return {*}
   */
  static getUniqIdWithoutId(prefix) {
    return uniqid(`${prefix}-`);
  }
}

module.exports = BlockchainUniqId;