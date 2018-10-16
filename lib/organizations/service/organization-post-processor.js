const EosImportance = require('../../eos/eos-importance');

class OrganizationPostProcessor {

  /**
   *
   * @param {Object[]} models
   */
  static processOneOrganizationInManyModels(models) {
    models.forEach(model => {
      this.processOneOrg(model.organization);
    });
  }

  /**
   *
   * @param {Object[]} models
   */
  static processOneOrganizationInManyModelsWithoutActivity(models) {
    models.forEach(model => {
      this.processOneOrgWithoutActivity(model.organization);
    });
  }

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
   * @param {Object[]} activityData
   */
  static processOneOrg(model, activityData = []) {
    if (!model) {
      return;
    }

    this.processOneOrgWithoutActivity(model);
    this._addFollowedBy(model, activityData);
  }

  /**
   *
   * @param {Object} model
   */
  static processOneOrgWithoutActivity(model) {
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

  /**
   *
   * @param {Object} org
   * @param {Object} activityData
   * @private
   */
  static _addFollowedBy(org, activityData) {
    org['followed_by'] = [];

    activityData.forEach(activity => {
      org.followed_by.push(activity);
    });
  }


  /**
   *
   * @param {Object} org
   * @param {number} currentUserId
   * @param {Object} activityData
   */
  static addMyselfDataToOneOrg(org, currentUserId, activityData) {
    if (!currentUserId) {
      return;
    }

    let myselfData  = {
      follow:   false,
      editable: false,
      member:   false
    };

    if (org.User.id === currentUserId) {
      myselfData.editable = true;
      myselfData.member   = true;
    }

    for (let i = 0; i < activityData.length; i++) {
      const activity = activityData[i];
      if (activity.id === currentUserId) {
        myselfData.follow = true;
        break;
      }
    }

    org.myselfData = myselfData;
  }
}

module.exports = OrganizationPostProcessor;