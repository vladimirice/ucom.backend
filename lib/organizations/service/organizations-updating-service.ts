import { UserModel } from '../../users/interfaces/model-interfaces';
import { AppError, BadRequestError, HttpForbiddenError } from '../../api/errors';
import { IActivityModel } from '../../users/interfaces/users-activity/dto-interfaces';

import UserActivityService = require('../../users/user-activity-service');
import UsersTeamService = require('../../users/users-team-service');
import OrganizationsInputProcessor = require('../validator/organizations-input-processor');
import EntityImageInputService = require('../../entity-images/service/entity-image-input-service');
import OrganizationsRepository = require('../repository/organizations-repository');
import OrganizationsModelProvider = require('./organizations-model-provider');
import EntitySourceService = require('../../entities/service/entity-sources-service');
import EosContentInputProcessor = require('../../eos/input-processor/content/eos-content-input-processor');

const _       = require('lodash');

const status  = require('statuses');
const models = require('../../../models');

const db = models.sequelize;

class OrganizationsUpdatingService {
  public static async updateOrganization(req: any, currentUser: UserModel) {
    OrganizationsInputProcessor.process(req.body);
    EntityImageInputService.processEntityImageOrMakeItEmpty(req.body);

    if (_.isEmpty(req.body) && _.isEmpty(req.files)) {
      throw new BadRequestError({
        general: 'Updating by empty body and empty file uploading is not allowed',
      });
    }

    const orgId = req.organization_id;
    const userId = currentUser.id;

    await this.checkUpdatePermissions(orgId, userId);
    const body = await OrganizationsInputProcessor.processUpdating(req, currentUser);

    const signedTransaction: string | null = EosContentInputProcessor.getSignedTransactionOrNull(body);

    const { updatedModel, newActivity, boardInvitationActivity } = await db
      .transaction(async (transaction) => {
        const [updatedCount, updatedModels] = await OrganizationsRepository.getOrganizationModel().update(body, {
          transaction,
          where: {
            id: orgId,
            user_id: userId,
          },
          returning: true,
          raw: true,
        });

        const deltaData = await UsersTeamService.processUsersTeamUpdating(
          orgId,
          OrganizationsModelProvider.getEntityName(),
          body,
          currentUser.id,
          transaction,
        );

        if (updatedCount !== 1) {
          throw new AppError(`No success to update organization with ID ${orgId} and author ID ${userId}`, status('not found'));
        }

        await EntitySourceService.processSourcesUpdating(
          orgId,
          OrganizationsModelProvider.getEntityName(),
          body,
          transaction,
        );

        // eslint-disable-next-line no-shadow
        let boardInvitationActivity = [];
        if (deltaData) {
          boardInvitationActivity =
            await OrganizationsUpdatingService.processUsersTeamInvitations(deltaData.added, orgId, transaction, currentUser);
        }

        // #task - remove backward compatibility
        let activity: IActivityModel | null = null;
        if (signedTransaction !== null) {
          activity = await UserActivityService.processOrganizationUpdating(
            signedTransaction,
            currentUser.id,
            updatedModels[0].id,
            transaction,
          );
        }

        return {
          boardInvitationActivity,
          newActivity: activity,
          updatedModel: updatedModels[0],
        };
      });

    // #task - remove backward compatibility
    if (newActivity !== null) {
      await UserActivityService.sendContentUpdatingPayloadToRabbitEosV2(newActivity);
    }

    await OrganizationsUpdatingService.sendOrgTeamInvitationsToRabbit(boardInvitationActivity);

    return updatedModel;
  }

  public static async sendOrgTeamInvitationsToRabbit(boardInvitationActivity) {
    for (const element of boardInvitationActivity) {
      await UserActivityService.sendPayloadToRabbit(element);
    }
  }

  private static async processUsersTeamInvitations(usersToAddFromRequest, orgId, transaction, currentUser: UserModel) {
    if (!usersToAddFromRequest || _.isEmpty(usersToAddFromRequest)) {
      return [];
    }

    const usersTeamIds = UsersTeamService.getUsersTeamIds(usersToAddFromRequest);
    const boardInvitationActivity: any = [];
    for (const element of usersTeamIds) {
      const res = await UserActivityService.processUsersBoardInvitation(
        currentUser.id,
        element,
        orgId,
        transaction,
      );

      boardInvitationActivity.push(res);
    }

    return boardInvitationActivity;
  }

  private static async checkUpdatePermissions(orgId: number, userId: number): Promise<void> {
    const doesExist = await OrganizationsRepository.doesExistWithUserId(orgId, userId);

    if (!doesExist) {
      throw new HttpForbiddenError(`It is not allowed for user with ID ${userId} to update organization with ID: ${orgId}`);
    }
  }
}

export = OrganizationsUpdatingService;
