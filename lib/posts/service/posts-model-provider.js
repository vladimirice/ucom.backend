const models = require('../../../models');
const ENTITY_NAME = 'posts     ';
const TABLE_NAME = 'posts';

const POST_STATS_TABLE_NAME = 'post_stats';

const MEDIA_POST_BLOCKCHAIN_ID_PREFIX = 'pstms';
const POST_OFFER_BLOCKCHAIN_ID_PREFIX = 'pstos';

class PostsModelProvider {

  /**
   *
   * @return {string}
   */
  static getMediaPostBlockchainIdPrefix() {
    return MEDIA_POST_BLOCKCHAIN_ID_PREFIX;
  }

  /**
   *
   * @return {string}
   */
  static getPostOfferBlockchainIdPrefix() {
    return POST_OFFER_BLOCKCHAIN_ID_PREFIX;
  }

  /**
   *
   * @return {string}
   */
  static getEntityName() {
    return ENTITY_NAME;
  }

  /**
   *
   * @return {string}
   */
  static getModelName() {
    return TABLE_NAME;
  }

  /**
   *
   * @return {Object}
   */
  static getModel() {
    return models[TABLE_NAME];
  }

  /**
   *
   * @return {Object}
   */
  static getPostStatsModel() {
    return models[POST_STATS_TABLE_NAME];
  }
}

module.exports = PostsModelProvider;