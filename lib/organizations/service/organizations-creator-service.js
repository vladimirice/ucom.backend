"use strict";
const OrgsCurrentParamsRepository = require("../repository/organizations-current-params-repository");
const OrganizationsModelProvider = require("./organizations-model-provider");
const EntitySourceService = require("../../entities/service/entity-sources-service");
const OrganizationsInputProcessor = require("../validator/organizations-input-processor");
const EntityImageInputService = require("../../entity-images/service/entity-image-input-service");
const OrganizationsRepository = require("../repository/organizations-repository");
const UsersTeamService = require("../../users/users-team-service");
const UserActivityService = require("../../users/user-activity-service");
const OrganizationsUpdatingService = require("./organizations-updating-service");
const EosPostsInputProcessor = require("../../eos/input-processor/content/eos-posts-input-processor");
const models = require('../../../models');
const db = models.sequelize;
class OrganizationsCreatorService {
    static async processNewOrganizationCreation(req, currentUser) {
        OrganizationsInputProcessor.process(req.body);
        EntityImageInputService.processEntityImageOrMakeItEmpty(req.body);
        await EosPostsInputProcessor.addSignedTransactionsForOrganizationCreation(currentUser, req.body);
        const body = await OrganizationsInputProcessor.processCreation(req, currentUser);
        const { newOrganization, newUserActivity, boardInvitationActivity } = await db
            .transaction(async (transaction) => {
            const newModel = await OrganizationsRepository.createNewOrganization(body, transaction);
            const usersTeam = await UsersTeamService.processNewModelWithTeam(newModel.id, OrganizationsModelProvider.getEntityName(), body, currentUser.id, transaction);
            const usersTeamIds = UsersTeamService.getUsersTeamIds(usersTeam);
            // eslint-disable-next-line no-shadow
            const newUserActivity = await UserActivityService.processNewOrganization(body.signed_transaction, currentUser.id, newModel.id, transaction);
            // eslint-disable-next-line no-shadow
            const boardInvitationActivity = [];
            for (const element of usersTeamIds) {
                const res = await UserActivityService.processUsersBoardInvitation(currentUser.id, element, newModel.id, transaction);
                boardInvitationActivity.push(res);
            }
            const entityName = OrganizationsModelProvider.getEntityName();
            await EntitySourceService.processCreationRequest(newModel.id, entityName, body, transaction);
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
module.exports = OrganizationsCreatorService;
