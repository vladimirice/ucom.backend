import { UserModel } from '../../users/interfaces/model-interfaces';

import OrgsCurrentParamsRepository = require('../repository/organizations-current-params-repository');
import OrganizationsModelProvider = require('./organizations-model-provider');
import EntitySourceService = require('../../entities/service/entity-sources-service');
import OrganizationsInputProcessor = require('../validator/organizations-input-processor');
import EntityImageInputService = require('../../entity-images/service/entity-image-input-service');
import OrganizationsRepository = require('../repository/organizations-repository');
import UsersTeamService = require('../../users/users-team-service');
import UserActivityService = require('../../users/user-activity-service');
import OrganizationsUpdatingService = require('./organizations-updating-service');
import EosContentInputProcessor = require('../../eos/input-processor/content/eos-content-input-processor');

const models = require('../../../models');

const db = models.sequelize;

class OrganizationsCreatorService {
  public static async processNewOrganizationCreation(req, currentUser: UserModel) {
    OrganizationsInputProcessor.process(req.body);
    EntityImageInputService.processEntityImageOrMakeItEmpty(req.body);

    EosContentInputProcessor.validateContentSignedTransactionDetailsOrError(req.body);

    const body = await OrganizationsInputProcessor.processCreation(req, currentUser);

    const { newOrganization, newUserActivity, boardInvitationActivity } = await db
      .transaction(async (transaction) => {
        const newModel =
          await OrganizationsRepository.createNewOrganization(body, transaction);

        const usersTeam = await UsersTeamService.processNewModelWithTeam(
          newModel.id,
          OrganizationsModelProvider.getEntityName(),
          body,
          currentUser.id,
          transaction,
        );

        const usersTeamIds = UsersTeamService.getUsersTeamIds(usersTeam);

        // eslint-disable-next-line no-shadow
        const newUserActivity = await UserActivityService.processNewOrganization(
          body.signed_transaction,
          currentUser.id,
          newModel.id,
          transaction,
        );

        // eslint-disable-next-line no-shadow
        const boardInvitationActivity: any = [];
        for (const element of usersTeamIds) {
          const res = await UserActivityService.processUsersBoardInvitation(
            currentUser.id,
            element,
            newModel.id,
            transaction,
          );

          boardInvitationActivity.push(res);
        }

        const entityName = OrganizationsModelProvider.getEntityName();
        await EntitySourceService.processCreationRequest(
          newModel.id,
          entityName,
          body,
          transaction,
        );

        // noinspection JSUnusedGlobalSymbols
        return {
          newUserActivity,
          boardInvitationActivity,
          newOrganization: newModel,
        };
      });

    // #task - create new entity via knex only and provide related transaction
    // #task use Promise.all when possible
    await Promise.all([
      OrgsCurrentParamsRepository.insertRowForNewEntity(newOrganization.id),
      UserActivityService.sendPayloadToRabbitWithEosVersion(newUserActivity, body.signed_transaction),
      OrganizationsUpdatingService.sendOrgTeamInvitationsToRabbit(boardInvitationActivity),
    ]);

    return newOrganization;
  }
}

export = OrganizationsCreatorService;
