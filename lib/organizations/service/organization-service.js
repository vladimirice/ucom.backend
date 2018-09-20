const OrganizationsRepositories = require('../repository');

class OrganizationService {
  constructor(currentUser) {
    this.currentUser = currentUser;
  }

  /**
   *
   * @return {Promise<Object>}
   */
  async getAllForPreview() {
    const models = await OrganizationsRepositories.Main.findAllForPreview();

    return {
      'data' : models,
      'metadata': [],
    };
  }
}

module.exports = OrganizationService;