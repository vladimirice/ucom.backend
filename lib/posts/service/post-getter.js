const PostRepositories = require('../repository');

class PostGetter {
  static async findAllOrganizationPosts(organization_id) {
    const where = {
      organization_id
    };

    // TODO
  }
}

module.exports = PostGetter;