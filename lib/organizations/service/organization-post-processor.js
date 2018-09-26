class OrganizationPostProcessor {

  /**
   *
   * @param {Object[]} models
   */
  static processManyOrganizations(models) {
    models.forEach(model => {
      this.processOneOrg(model);
    })
  }

  /**
   *
   * @param {Object} model
   */
  static processOneOrg(model) {
    this._addPrefixToAvatarFilename(model);
  }

  /**
   *
   * @param {Object} model
   * @private
   */
  static _addPrefixToAvatarFilename(model) {
    if (model.avatar_filename) {
      model.avatar_filename = `organizations/${model.avatar_filename}`
    } else {
      model.avatar_filename = null;
    }
  }
}

module.exports = OrganizationPostProcessor;