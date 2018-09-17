const models = require('../../models');

class IpfsMetaRepository {
  static async createNew(data) {
    return await this.getModel().create(data);
  }

  static async findAllMetaByPostId(post_id) {
    return await this.getModel().findOne({
      where: {
        post_id
      },
      raw: true
    });
  }

  static getModel() {
    return models[this.getModelName()];
  }

  static getModelName() {
    return 'ipfs_meta';
  }
}

module.exports = IpfsMetaRepository;