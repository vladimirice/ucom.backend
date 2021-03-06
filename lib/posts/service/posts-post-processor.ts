import { ContentTypesDictionary } from 'ucom.libs.common';
import { PostModelResponse } from '../interfaces/model-interfaces';

const postsModelProvider = require('./posts-model-provider');

class PostsPostProcessor {
  /**
   *
   * @param {Object} post
   */
  static processPostInCommon(post) {
    this.flattenPostStats(post);
    this.makeFieldsNumeric(post);

    switch (post.post_type_id) {
      case ContentTypesDictionary.getTypeDirectPost():
        this.processDirectPost(post);
        break;
      case ContentTypesDictionary.getTypeOffer():
        this.processPostOffer(post);
        break;
      default:
      // do nothing
    }

    if (post.entity_images && typeof post.entity_images === 'string') {
      post.entity_images = JSON.parse(post.entity_images);
    } else if (!post.entity_images)  {
      post.entity_images = {};
    }
  }

  private static makeFieldsNumeric(post: PostModelResponse): void {
    const arr = [
      'entity_id_for',
    ];

    arr.forEach((item) => {
      post[item] = +post[item];
    });
  }

  /**
   *
   * @param {Object} post
   * @private
   */
  private static flattenPostStats(post) {
    const postStats = post.post_stats;

    // eslint-disable-next-line guard-for-in
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
  private static flattenPostOffer(post) {
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

      if (excludePostOffer.includes(field)) {
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
  private static processDirectPost(post) {
    const toExclude = postsModelProvider.getModel().getFieldsToExcludeFromDirectPost();

    for (const field in post) {
      if (toExclude.includes(field)) {
        delete post[field];
      }
    }
  }

  /**
   *
   * @param {Object} post
   * @private
   */
  private static processPostOffer(post) {
    this.flattenPostOffer(post);
  }
}

export = PostsPostProcessor;
