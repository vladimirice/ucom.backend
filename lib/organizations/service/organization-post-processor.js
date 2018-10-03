const EosImportance = require('../../eos/eos-importance');

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
    this._normalizeMultiplier(model);
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

  static _normalizeMultiplier(model) {
    const multiplier = EosImportance.getImportanceMultiplier();

    model.current_rate = (model.current_rate * multiplier);
    model.current_rate = +model.current_rate.toFixed();
  }

}

module.exports = OrganizationPostProcessor;