const postsFetchService         = require('../../posts/service/posts-fetch-service');
const usersFetchService         = require('../../users/service/users-fetch-service');
const organizationsFetchService =
  require('../../organizations/service/organizations-fetch-service');

const tagsRepository = require('../../tags/repository/tags-repository');
const moment = require('moment');

class TagsFetchService {
  /**
   *
   * @param {string} tagTitle
   * @param {number|null} currentUserId
   * @returns {Promise<Object>}
   */
  static async findAndProcessOneTagById(tagTitle: string, currentUserId: number | null) {
    // #task - should be provided by frontend
    const wallFeedQuery = {
      page: 1,
      per_page: 10,
    };

    const relatedEntitiesQuery = {
      page: 1,
      per_page: 5,
      v2: true,
    };

    const [posts, users, orgs, tag] = await Promise.all([
      postsFetchService.findAndProcessAllForTagWallFeed(tagTitle, currentUserId, wallFeedQuery),
      usersFetchService.findAllAndProcessForListByTagTitle(
        tagTitle,
        relatedEntitiesQuery,
        currentUserId,
      ),
      organizationsFetchService.findAndProcessAllByTagTitle(tagTitle, relatedEntitiesQuery),
      tagsRepository.findOneByTitle(tagTitle),
    ]);

    return {
      posts,
      users,
      orgs,

      id:         tag.id,
      title:      tag.title,
      created_at: moment(tag.created_at).utc().format('YYYY-MM-DD HH:mm:ss'),
      current_rate: 0,
    };
  }
}

module.exports = TagsFetchService;
