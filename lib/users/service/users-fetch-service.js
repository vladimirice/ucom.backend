const UsersRepository       = require('../users-repository');
const QueryFilterService    = require('../../api/filters/query-filter-service');
const UsersActivityService  = require('../user-activity-service');
const UserPostProcessor     = require('../user-post-processor');
const ApiPostProcessor      = require('../../common/service').PostProcessor;

class UsersFetchService {
  /**
   *
   * @param {Object} query
   * @param {number|null} currentUserId
   * @returns {Promise<Object>}
   */
  static async findAllAndProcessForList(query, currentUserId) {
    // preparation for universal class-fetching processor
    const repository    = UsersRepository;
    let params          = QueryFilterService.getQueryParametersWithRepository(query, repository);

    const [models, totalAmount] = await Promise.all([
      repository.findAllForList(params),
      repository.countAll(params)
    ]);
    // end of future universal part

    if (currentUserId) {
      const activityData = await UsersActivityService.getUserActivityData(currentUserId);
      UserPostProcessor.addMyselfDataByActivityArrays(models, activityData);
    }

    ApiPostProcessor.processUsersAfterQuery(models);
    const metadata = QueryFilterService.getMetadata(totalAmount, query, params);

    if (query.v2) {
      return {
        data: models,
        metadata
      };
    }

    return models;
  }

  /**
   *
   * @param {string} tagTitle
   * @param {Object} query
   * @param {number} currentUserId
   * @returns {Promise<*>}
   */
  static async findAllAndProcessForListByTagTitle(tagTitle, query, currentUserId) {
    const repository    = UsersRepository;
    let params          = QueryFilterService.getQueryParametersWithRepository(query, repository);

    const [models, totalAmount] = await Promise.all([
      repository.findAllByTagTitle(tagTitle, params),
      repository.countAllByTagTitle(tagTitle),
    ]);

    if (currentUserId) {
      const activityData = await UsersActivityService.getUserActivityData(currentUserId);
      UserPostProcessor.addMyselfDataByActivityArrays(models, activityData);
    }

    ApiPostProcessor.processUsersAfterQuery(models);
    const metadata = QueryFilterService.getMetadata(totalAmount, query, params);

    if (query.v2) {
      return {
        data: models,
        metadata
      };
    }

    return models;
  }
}

module.exports = UsersFetchService;