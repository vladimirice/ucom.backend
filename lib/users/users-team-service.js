"use strict";
const DeleteAllInArrayValidator = require("../common/validator/form-data/delete-all-in-array-validator");
const UsersTeamRepository = require("./repository/users-team-repository");
const _ = require('lodash');
const usersTeamRepository = require('./repository').UsersTeam;
const USERS_TEAM_PROPERTY = 'users_team';
const updateManyToManyHelper = require('../api/helpers/UpdateManyToManyHelper');
const models = require('../../models');
class UsersTeamService {
    /**
     *
     * @param {Object[]} usersTeam
     * @return {number[]}
     */
    static getUsersTeamIds(usersTeam) {
        const usersIds = [];
        if (!usersTeam || _.isEmpty(usersTeam)) {
            return [];
        }
        for (const current of usersTeam) {
            const userId = current.id || current.user_id;
            usersIds.push(userId);
        }
        return usersIds;
    }
    /**
     *
     * @param {number} entityId
     * @param {string} entityName
     * @param {Object} data
     * @param {number|null} idToExclude
     * @param {Object|null} transaction
     * @return {Promise<Object[]>}
     */
    static async processNewModelWithTeam(entityId, entityName, data, idToExclude = null, transaction = null) {
        // eslint-disable-next-line you-dont-need-lodash-underscore/filter
        const usersTeam = _.filter(data[USERS_TEAM_PROPERTY]);
        if (!usersTeam || _.isEmpty(usersTeam)) {
            return [];
        }
        const promises = [];
        usersTeam.forEach((user) => {
            if (idToExclude === null || +user.id !== idToExclude) {
                const givenData = {
                    entity_id: entityId,
                    entity_name: entityName,
                    user_id: +user.id,
                };
                // #task make this separately
                promises.push(usersTeamRepository.createNew(givenData, transaction));
            }
        });
        await Promise.all(promises);
        return usersTeam;
    }
    static async processUsersTeamUpdating(entityId, entityName, data, idToExclude = null, transaction = null) {
        if (!data[USERS_TEAM_PROPERTY]) {
            return null;
        }
        if (DeleteAllInArrayValidator.isValueMeanDeleteAll(data[USERS_TEAM_PROPERTY])) {
            await UsersTeamRepository.deleteAllByEntityIdEntityName(entityId, entityName);
            return null;
        }
        // eslint-disable-next-line you-dont-need-lodash-underscore/filter
        const usersTeam = _.filter(data[USERS_TEAM_PROPERTY]);
        if (!usersTeam || _.isEmpty(usersTeam)) {
            // NOT possible to remove all users because of this. Wil be fixed later
            return null;
        }
        const usersTeamFiltered = usersTeam.filter(item => +item.id !== idToExclude);
        const sourceModels = await usersTeamRepository.findAllRelatedToEntity(entityName, entityId);
        const deltaData = updateManyToManyHelper.getCreateDeleteOnlyDelta(sourceModels, usersTeamFiltered, 'user_id', 'id');
        // tslint:disable-next-line:max-line-length
        await this.updateRelations(entityId, entityName, deltaData, usersTeamRepository.getModelName(), transaction);
        return deltaData;
    }
    /**
     *
     * @param {number} entityId
     * @param {string} entityName
     * @param {Object[]} deltaData
     * @param {string} modelName
     * @param {Object} transaction
     * @return {Promise<boolean>}
     */
    static async updateRelations(entityId, entityName, deltaData, modelName, transaction) {
        const promises = [];
        deltaData.added.forEach((data) => {
            data.entity_id = entityId;
            data.entity_name = entityName;
            data.user_id = data.id;
            delete data.id;
            promises.push(models[modelName].create(data, { transaction }));
        });
        deltaData.deleted.forEach((data) => {
            const promise = models[modelName].destroy({
                transaction,
                where: {
                    id: data.id,
                },
            });
            promises.push(promise);
        });
        return Promise.all(promises);
    }
}
module.exports = UsersTeamService;
