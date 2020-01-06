import { UserModel } from '../../users/interfaces/model-interfaces';
import { BadRequestError } from '../../api/errors';
import {
  ORGANIZATION_TYPE_ID__CONTENT,
  ORGANIZATION_TYPE_ID__MULTI_SIGNATURE,
} from '../dictionary/organizations-dictionary';
import { OrgModel } from '../interfaces/model-interfaces';
import { IRequestBody } from '../../common/interfaces/common-types';

import OrgsCurrentParamsRepository = require('../repository/organizations-current-params-repository');
import OrganizationsModelProvider = require('./organizations-model-provider');
import EntitySourceService = require('../../entities/service/entity-sources-service');
import OrganizationsInputProcessor = require('../validator/organizations-input-processor');
import EntityImageInputService = require('../../entity-images/service/entity-image-input-service');
import OrganizationsRepository = require('../repository/organizations-repository');
import UsersTeamService = require('../../users/users-team-service');
import UserActivityService = require('../../users/user-activity-service');
import OrganizationsUpdatingService = require('./organizations-updating-service');
import EosInputProcessor = require('../../eos/input-processor/content/eos-input-processor');
import EosApi = require('../../eos/eosApi');
import knex = require('../../../config/knex');

const models = require('../../../models');

const db = models.sequelize;

class OrganizationsCreatorService {
  public static async updateOrganizationSetMultiSignature(
    organization: OrgModel, user: UserModel, body: IRequestBody,
  ): Promise<void> {
    if (organization.user_id !== user.id) {
      throw new BadRequestError('Only community author is able to change community type to the multi-signature');
    }

    if (organization.organization_type_id !== ORGANIZATION_TYPE_ID__CONTENT) {
      throw new BadRequestError(`Only community with type: ${ORGANIZATION_TYPE_ID__CONTENT} might be migrated`);
    }

    const { account_name: accountName } = body;

    if (!accountName) {
      throw new BadRequestError('Please provide an existing multi-signature account_name');
    }

    // #task - check a multi-signature status of the account
    const doesExist = await EosApi.doesAccountExist(accountName);

    if (!doesExist) {
      throw new BadRequestError(`account with the name: ${accountName} does not exist`);
    }

    await knex(OrganizationsModelProvider.getTableName())
      .where({ id: organization.id })
      .update({
        nickname: accountName,
        organization_type_id: ORGANIZATION_TYPE_ID__MULTI_SIGNATURE,
      });
  }

  public static async processNewOrganizationCreation(req, currentUser: UserModel, isMultiSignature: boolean) {
    OrganizationsInputProcessor.process(req.body);
    EntityImageInputService.processEntityImageOrMakeItEmpty(req.body);

    const signedTransaction = await EosInputProcessor.processWithIsMultiSignatureForCreation(
      req.body,
      'nickname',
      isMultiSignature,
    );

    const body = await OrganizationsInputProcessor.processCreation(req, currentUser);

    const { newOrganization, newUserActivity, boardInvitationActivity } = await db
      .transaction(async (transaction) => {
        const newModel =
          await OrganizationsRepository.createNewOrganization(body, isMultiSignature, transaction);

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
          signedTransaction,
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
    await Promise.all([
      OrgsCurrentParamsRepository.insertRowForNewEntity(newOrganization.id),
      UserActivityService.sendPayloadToRabbitEosV2WithSuppressEmpty(newUserActivity),
      OrganizationsUpdatingService.sendOrgTeamInvitationsToRabbit(boardInvitationActivity),
    ]);

    return newOrganization;
  }
}

export = OrganizationsCreatorService;
