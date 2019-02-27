import OrganizationsToEntitiesRepository = require('../repository/organizations-to-entities-repository');

class OrganizationsFetchRelated {
  // @ts-ignore
  public static async getManyDiscussions(orgId: number, currentUserId: number | null) {
    return OrganizationsToEntitiesRepository.findManyDiscussions(orgId);

    // if (orgId % 2 !== 0) {
    //   return [];
    // }
    //
    // const query: PostRequestQueryDto = {
    //   entity_state: 'card',
    //   post_type_id: 10,
    //   page: 1,
    //   per_page: 5,
    // };
    //
    // const posts: PostsListResponse = await PostsFetchService.findManyPosts(query, currentUserId);
    //
    // const processedPosts: any[] = [];
    // posts.data.forEach((post) => {
    //   processedPosts.push({
    //     id: post.id,
    //     entity_images: post.entity_images,
    //     user_id: post.user_id,
    //     post_type_id: post.post_type_id,
    //     main_image_filename: post.main_image_filename,
    //     created_at: post.created_at,
    //     updated_at: post.updated_at,
    //   });
    // });
    //
    // return processedPosts;
  }
}

export = OrganizationsFetchRelated;
