import { MyselfDataDto } from '../../common/interfaces/post-processing-dto';

const eosImportance = require('../../eos/eos-importance');

class OrganizationPostProcessor {

  /**
   *
   * @param {Object[]} models
   */
  static processOneOrganizationInManyModels(models) {
    models.forEach((model) => {
      this.processOneOrg(model.organization);
    });
  }

  /**
   *
   * @param {Object[]} models
   */
  static processOneOrganizationInManyModelsWithoutActivity(models) {
    models.forEach((model) => {
      this.processOneOrgWithoutActivity(model.organization);
    });
  }

  /**
   *
   * @param {Object[]} models
   */
  static processManyOrganizations(models) {
    models.forEach((model) => {
      this.processOneOrg(model);
    });
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
    this.addFollowedBy(model, activityData);
  }

  /**
   *
   * @param {Object} model
   */
  static processOneOrgWithoutActivity(model) {
    this.addPrefixToAvatarFilename(model);
    this.normalizeMultiplier(model);
  }

  /**
   *
   * @param {Object} model
   * @private
   */
  private static addPrefixToAvatarFilename(model) {
    if (model.avatar_filename) {
      model.avatar_filename = `organizations/${model.avatar_filename}`;
    } else {
      model.avatar_filename = null;
    }
  }

  private static normalizeMultiplier(model) {
    const multiplier = eosImportance.getImportanceMultiplier();

    model.current_rate = (model.current_rate * multiplier);
    model.current_rate = +model.current_rate.toFixed();
  }

  /**
   *
   * @param {Object} org
   * @param {Object} activityData
   * @private
   */
  private static addFollowedBy(org, activityData) {
    org['followed_by'] = [];

    activityData.forEach((activity) => {
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

    const myselfData: MyselfDataDto = {
      follow:   false,
      editable: false,
      member:   false,
    };

    if (org.User.id === currentUserId) {
      myselfData.editable = true;
      myselfData.member   = true;
    } else {
      myselfData.member =
        org.users_team.some(user => user.User.id === currentUserId && user.status === 1);
    }

    for (let i = 0; i < activityData.length; i += 1) {
      const activity = activityData[i];
      if (activity.id === currentUserId) {
        myselfData.follow = true;
        break;
      }
    }

    org.myselfData = myselfData;
  }
}

export = OrganizationPostProcessor;
