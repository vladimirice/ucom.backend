import OrganizationsToEntitiesRepository = require('../repository/organizations-to-entities-repository');
import ApiPostProcessor = require('../../common/service/api-post-processor');

class OrganizationsFetchRelated {
  public static async getManyDiscussions(orgId: number) {
    const posts = await OrganizationsToEntitiesRepository.findManyDiscussions(orgId);

    return ApiPostProcessor.processManyPosts(posts);
  }
}

export = OrganizationsFetchRelated;
