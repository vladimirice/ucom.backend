import { MyselfDataDto } from '../../common/interfaces/post-processing-dto';
import { OrgIdToOrgModelCard, OrgModel, OrgModelCard } from '../interfaces/model-interfaces';

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
      this.processOneOrgModelCard(model.organization);
    });
  }

  public static processManyOrganizations(models, options: any = {}) {
    for (const model of models) {
      this.processOneOrg(model, [], options);
    }
  }

  public static processOneOrg(
    model: OrgModel,
    activityData: any = [],
    options: any = {},
  ): void {
    if (!model) {
      return;
    }

    this.processOneOrgModelCard(model);

    if (!options.skipFollowedBy) {
      this.addFollowedBy(model, activityData);
    }
  }

  public static processOrgIdToOrgModelCard(modelsSet: OrgIdToOrgModelCard): void {
    for (const orgId in modelsSet) {
      if (modelsSet.hasOwnProperty(orgId)) {
        const model = modelsSet[orgId];
        this.processOneOrgModelCard(model);
      }
    }
  }

  public static processOneOrgModelCard(model: OrgModelCard): void {
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

    model.current_rate *= multiplier;
    model.current_rate = +model.current_rate.toFixed();
  }

  /**
   *
   * @param {Object} org
   * @param {Object} activityData
   * @private
   */
  private static addFollowedBy(org, activityData) {
    org.followed_by = [];

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

    for (const activity of activityData) {
      if (activity.id === currentUserId) {
        myselfData.follow = true;
        break;
      }
    }

    org.myselfData = myselfData;
  }
}

export = OrganizationPostProcessor;
