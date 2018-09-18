const models = require('../../models');

class IpfsMetaRepository {
  static async createNew(data) {
    return await this.getPostsMetaModel().create(data);
  }

  static async findAllPostMetaByPostId(post_id) {
    return await this.getPostsMetaModel().findOne({
      where: {
        post_id
      },
      raw: true
    });
  }

  static getPostsMetaModel() {
    return models[this.getPostMetaModelName()];
  }

  static getPostMetaModelName() {
    return 'post_ipfs_meta';
  }
}

module.exports = IpfsMetaRepository;