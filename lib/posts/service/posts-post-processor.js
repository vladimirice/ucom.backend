const PostsModelProvider = require('./posts-model-provider');
const ContentTypeDictionary = require('ucom-libs-social-transactions').ContentTypeDictionary;

class PostsPostProcessor {
  /**
   *
   * @param {Object} post
   */
  static processPostInCommon(post) {
    this._flattenPostStats(post);

    switch (post.post_type_id) {
      case ContentTypeDictionary.getTypeDirectPost():
        this._processDirectPost(post);
        break;
      case ContentTypeDictionary.getTypeOffer():
        this._processPostOffer(post);
        break;
      default:
      // do nothing
    }
  }

  /**
   *
   * @param {Object} post
   * @private
   */
  static _flattenPostStats(post) {
    const postStats = post.post_stats;

    for (const field in postStats) {
      if (post.hasOwnProperty(field)) {
        throw new Error(`Post itself has field ${field} but it must be taken from postStats`);
      }

      post[field] = postStats[field];
    }

    delete post.post_stats;
  }

  /**
   *
   * @param {Object} post
   * @private
   */
  static _flattenPostOffer(post) {
    if (!post.post_offer) {
      return;
    }

    const excludePostOffer = [
      'id',
    ];

    for (const field in post.post_offer) {
      if (!post.post_offer.hasOwnProperty(field)) {
        continue;
      }

      if (excludePostOffer.indexOf(field) !== -1) {
        continue;
      }

      if (post.hasOwnProperty(field)) {
        throw new Error(`Post itself has property ${field} but it must be taken from post_offer`);
      }

      post[field] = post.post_offer[field];
    }

    delete post.post_offer;
  }

  /**
   *
   * @param {Object} post
   */
  static _processDirectPost(post) {
    const toExclude = PostsModelProvider.getModel().getFieldsToExcludeFromDirectPost();

    for (const field in post) {
      if (toExclude.indexOf(field) !== -1) {
        delete post[field];
      }
    }
  }

  /**
   *
   * @param {Object} post
   * @private
   */
  static _processPostOffer(post) {
    this._flattenPostOffer(post);
  }
}

module.exports = PostsPostProcessor;
