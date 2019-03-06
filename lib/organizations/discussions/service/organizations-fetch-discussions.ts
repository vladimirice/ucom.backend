import ApiPostProcessor = require('../../../common/service/api-post-processor');
import OrganizationsDiscussionsRepository = require('../repository/organizations-discussions-repository');

class OrganizationsFetchDiscussions {
  public static async getManyDiscussions(orgId: number) {
    const posts = await OrganizationsDiscussionsRepository.findManyDiscussions(orgId);

    return ApiPostProcessor.processManyPosts(posts);
  }
}

export = OrganizationsFetchDiscussions;
