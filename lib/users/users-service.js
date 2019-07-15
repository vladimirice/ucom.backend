"use strict";
/* eslint-disable max-len,you-dont-need-lodash-underscore/filter */
/* tslint:disable:max-line-length */
const errors_1 = require("../api/errors");
const UsersRepository = require("./users-repository");
const UserPostProcessor = require("./user-post-processor");
const UsersInputProcessor = require("./validator/users-input-processor");
const EosBlockchainStatusDictionary = require("../eos/eos-blockchain-status-dictionary");
const UsersModelProvider = require("./users-model-provider");
const UpdateManyToManyHelper = require("../api/helpers/UpdateManyToManyHelper");
const UserInputSanitizer = require("../api/sanitizers/user-input-sanitizer");
const DeleteAllInArrayValidator = require("../common/validator/form-data/delete-all-in-array-validator");
const knex = require("../../config/knex");
const EntityImageInputService = require("../entity-images/service/entity-image-input-service");
const moment = require("moment");
const UserActivityService = require("./user-activity-service");
const _ = require('lodash');
const models = require('../../models');
class UsersService {
    /**
     *
     * @param {string} query
     * @returns {Promise<Array<Object>>}
     */
    static async findByNameFields(query) {
        return UsersRepository.findByNameFields(query);
    }
    static async processUserUpdating(req, currentUser) {
        const { body } = req;
        const { files } = req;
        const requestData = UsersInputProcessor.processWithValidation(body);
        // #task #refactor
        for (const field in requestData) {
            if (requestData[field] === '') {
                requestData[field] = null;
            }
        }
        EntityImageInputService.processEntityImageOrMakeItEmpty(requestData);
        const userId = currentUser.id;
        const user = await UsersRepository.getUserById(userId);
        await UsersService.checkUniqueFields(requestData, userId);
        // #task #refactor
        // noinspection OverlyComplexBooleanExpressionJS
        if (files && files.avatar_filename && files.avatar_filename[0] && files.avatar_filename[0].filename) {
            requestData.avatar_filename = files.avatar_filename[0].filename;
        }
        // noinspection OverlyComplexBooleanExpressionJS
        if (files && files.achievements_filename && files.achievements_filename[0] && files.achievements_filename[0].filename) {
            requestData.achievements_filename = files.achievements_filename[0].filename;
        }
        requestData.profile_updated_at = moment().utc().format();
        requestData.profile_updated_by = 1;
        const activity = await models.sequelize
            .transaction(async (transaction) => {
            await UsersService.processArrayFields(user, requestData, transaction);
            await UsersRepository.updateUserById(userId, requestData, transaction);
            let newActivity = null;
            if (requestData.signed_transaction) {
                newActivity = await UserActivityService.createForUserUpdatesProfile(body.signed_transaction, currentUser.id, transaction);
            }
            return newActivity;
        });
        if (activity !== null) {
            await UserActivityService.sendPayloadToRabbitEosV2(activity);
        }
        const userModel = await UsersRepository.getUserById(userId);
        const userJson = userModel.toJSON();
        UserPostProcessor.processUosAccountsProperties(userJson);
        UserPostProcessor.processUsersCurrentParams(userJson);
        return userJson;
    }
    static async findOneByAccountName(accountName) {
        const user = await models.Users.findOne({ where: { account_name: accountName } });
        UserPostProcessor.processUser(user);
        return user;
    }
    /**
     *
     * @param {Object} user
     * @param {Object} transaction
     * @return {Promise<void>}
     */
    static async setBlockchainRegistrationIsSent(user, transaction) {
        await user.update({
            blockchain_registration_status: EosBlockchainStatusDictionary.getStatusIsSent(),
        }, {
            transaction,
        });
    }
    /**
     *
     * @param {Object} user
     * @param {Object} requestData
     * @param {Object} transaction
     * @return {Promise<void>}
     * @private
     */
    static async processArrayFields(user, requestData, transaction) {
        const arrayFields = [
            'users_education',
            'users_jobs',
            'users_sources',
        ];
        await this.deleteAllIfRequired(arrayFields, user, requestData);
        if (requestData.users_sources) {
            requestData.users_sources = _.filter(requestData.users_sources);
            requestData.users_sources.forEach((source) => {
                source.source_type_id = source.source_type_id ? source.source_type_id : null;
            });
        }
        for (const field of arrayFields) {
            if (!requestData[field]) {
                continue;
            }
            const set = _.filter(requestData[field]);
            if (_.isEmpty(set)) {
                continue;
            }
            UserInputSanitizer.sanitizeInputWithModelProvider(set, UsersModelProvider.getFieldsSetByFieldName(field));
            const deltaData = UpdateManyToManyHelper.getCreateUpdateDeleteDelta(user[field], set);
            await UsersService.updateRelations(user, deltaData, field, transaction);
        }
    }
    static async deleteAllIfRequired(arrayFields, user, body) {
        for (const field of arrayFields) {
            const value = body[field];
            if (!value) {
                continue;
            }
            if (!DeleteAllInArrayValidator.isValueMeanDeleteAll(value)) {
                continue;
            }
            await knex(field)
                .delete()
                .where('user_id', user.id);
            delete body[field];
        }
    }
    /**
     *
     * @param {Object} user
     * @param {Object} deltaData
     * @param {string} modelName
     * @param {Object} transaction
     * @return {Promise<boolean>}
     */
    static async updateRelations(user, deltaData, modelName, transaction) {
        // Update addresses
        await Promise.all([
            deltaData.deleted.map(async (data) => {
                await data.destroy({ transaction });
            }),
            deltaData.added.map(async (data) => {
                data.user_id = user.id;
                data.is_official = !!data.is_official;
                const newModel = models[modelName].build(data);
                await newModel.save(); // #task check is transaction work
            }),
            deltaData.changed.map(async (data) => {
                const toUpdate = user[modelName].find(innerData => +innerData.id === +data.id);
                data.is_official = !!data.is_official;
                await toUpdate.update(data, { transaction });
            }),
        ]);
        return true;
    }
    /**
     *
     * @param   {Object} values
     * @param   {number} currentUserId
     * @return  {Promise<void>}
     * @private
     */
    static async checkUniqueFields(values, currentUserId) {
        const uniqueFields = UsersModelProvider.getUsersModel().getUsersUniqueFields();
        const toFind = {};
        uniqueFields.forEach((field) => {
            if (values[field]) {
                toFind[field] = values[field];
            }
        });
        const existed = await UsersRepository.findWithUniqueFields(toFind);
        const errors = [];
        for (const current of existed) {
            if (current.id === currentUserId) {
                // this is model itself
                continue;
            }
            uniqueFields.forEach((field) => {
                if (current[field] && current[field] === toFind[field]) {
                    errors.push({
                        field,
                        message: 'This value is already occupied. You should try another one.',
                    });
                }
            });
        }
        if (errors.length > 0) {
            throw new errors_1.BadRequestError(errors);
        }
    }
}
module.exports = UsersService;
