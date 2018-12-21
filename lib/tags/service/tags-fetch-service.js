const PostsFetchService         = require('../../posts/service/posts-fetch-service');
const UsersFetchService         = require('../../users/service/users-fetch-service');
const OrganizationsFetchService = require('../../organizations/service/organizations-fetch-service');

class TagsFetchService {
  /**
   *
   * @param {number} tagIdentity
   * @returns {Promise<Object>}
   */
  static async findAndProcessOneTagById(tagIdentity) {
    const query = {
      page: 1,
      per_page: 10,
      v2: true,
    };

    const posts = await PostsFetchService.findAndProcessAllForUserWallFeed(1, null, query);
    const users = await UsersFetchService.findAllAndProcessForList(query, null);
    const orgs = await OrganizationsFetchService.findAndProcessAll(query);

    return {
      id: 1,
      title: 'tag-name',
      created_at: '2018-12-25 16:00:00Z',
      current_rate: 10.001, // tag current rate


      posts: posts,
      users: users,
      orgs: orgs
    };
  }
}

module.exports = TagsFetchService;