const QueryFilterService  = require('../../api/filters/query-filter-service');
const ApiPostProcessor    = require('../../common/service').PostProcessor;
const UsersFeedRepository = require('../../common/repository').UsersFeed;

const UsersActivityRepository    = require('../../users/repository/users-activity-repository');

class PostsFetchService {
  /**
   *
   * @param {Object} query
   * @param {number} currentUserId
   * @return {Promise<{data, metadata: {total_amount: *, page: number, per_page: number, has_more: boolean}}>}
   */
  static async findAndProcessAllForMyselfNewsFeed(query, currentUserId) {
    let params = QueryFilterService.getQueryParameters(query);

    const { orgIds, usersIds } = await UsersActivityRepository.findOneUserFollowActivity(currentUserId);

    const findCountPromises = [
      UsersFeedRepository.findAllForUserNewsFeed(currentUserId, usersIds, orgIds, params),
      UsersFeedRepository.countAllForUserNewsFeed(currentUserId, usersIds, orgIds),
    ];

    return this._findAndProcessAllForWallFeed(query, params, currentUserId, findCountPromises);
  }

  /**
   *
   * @param {number} orgId
   * @param {Object} query
   * @param {number} currentUserId
   * @return {Promise<{data, metadata: {total_amount: *, page: number, per_page: number, has_more: boolean}}>}
   */
  static async findAndProcessAllForOrgWallFeed(orgId, query, currentUserId) {
    let params = QueryFilterService.getQueryParameters(query);

    const findCountPromises = [
      UsersFeedRepository.findAllForOrgWallFeed(orgId, params),
      UsersFeedRepository.countAllForOrgWallFeed(orgId)
    ];

    return this._findAndProcessAllForWallFeed(query, params, currentUserId, findCountPromises);
  }

  /**
   *
   * @param {number} userId
   * @param {number|null} currentUserId
   * @param {Object} query
   * @return {Promise<{data, metadata: {total_amount: *, page: number, per_page: number, has_more: boolean}}>}
   */
  static async findAndProcessAllForUserWallFeed(userId, currentUserId, query = null) {
    let params = QueryFilterService.getQueryParameters(query);

    const findCountPromises = [
      UsersFeedRepository.findAllForUserWallFeed(userId, params),
      UsersFeedRepository.countAllForUserWallFeed(userId)
    ];

    return this._findAndProcessAllForWallFeed(query, params, currentUserId, findCountPromises);
  }

  /**
   *
   * @param {Object} query
   * @param {Object} params
   * @param {number} currentUserId
   * @param {Promise[]} findCountPromises
   * @return {Promise<{data: Array, metadata: {total_amount: *, page: number, per_page: number, has_more: boolean}}>}
   * @private
   */
  static async _findAndProcessAllForWallFeed(query, params, currentUserId, findCountPromises) {
    const [posts, totalAmount] = await Promise.all(findCountPromises);

    let postsIds = posts.map(post => {
      return post.id;
    });

    let userActivity;
    if (currentUserId) {
      const postsActivity = await UsersActivityRepository.findOneUserToPostsVotingAndRepostActivity(currentUserId, postsIds);
      userActivity = {
        posts: postsActivity
      };
    }

    const data      = ApiPostProcessor.processManyPosts(posts, currentUserId, userActivity);
    const metadata  = QueryFilterService.getMetadata(totalAmount, query, params);

    return {
      data,
      metadata
    }
  }
}

module.exports = PostsFetchService;