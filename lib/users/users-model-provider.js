"use strict";
const models = require('../../models');
const USERS_TABLE_NAME = 'Users';
const USERS_TEAM_TABLE_NAME = 'users_team';
const USERS_ACTIVITY_TABLE_NAME = 'users_activity';
const USERS_ACTIVITY_TRUST_TABLE_NAME = 'users_activity_trust';
const USERS_ENTITY_NAME = 'users     '; // in db there is a fixed char length of 10
class UsersModelProvider {
    /**
     * alias
     * @return {string}
     */
    static getEntityName() {
        return this.getUsersEntityName();
    }
    /**
     *
     * @return {string}
     */
    static getUsersEntityName() {
        return USERS_ENTITY_NAME;
    }
    /**
     * alias
     * @return {string}
     */
    static getTableName() {
        return this.getUsersTableName();
    }
    /**
     *
     * @return {string}
     */
    static getBlockchainIdFieldName() {
        return 'account_name';
    }
    /**
     *
     * @return {string}
     */
    static getUsersTableName() {
        return USERS_TABLE_NAME;
    }
    static getUsersActivityTableName() {
        return USERS_ACTIVITY_TABLE_NAME;
    }
    static getUsersActivityTrustTableName() {
        return USERS_ACTIVITY_TRUST_TABLE_NAME;
    }
    /**
     *
     * @return {Object}
     */
    static getUsersActivityModel() {
        return models[this.getUsersActivityTableName()];
    }
    /**
     *
     * @return {string}
     */
    static getUsersTeamTableName() {
        return USERS_TEAM_TABLE_NAME;
    }
    /**
     *
     * @return {Object}
     */
    static getUsersModel() {
        return models[USERS_TABLE_NAME];
    }
    /**
     *
     * @return {Object}
     */
    static getUsersTeamModel() {
        return models[USERS_TEAM_TABLE_NAME];
    }
    /**
     *
     * @return {string[]}
     */
    static getUserFieldsForPreview() {
        return this.getUsersModel().getFieldsForPreview();
    }
    /**
     *
     * @param {string|null} alias
     * @return {Object}
     */
    static getIncludeUsersPreview(alias = null) {
        const include = {
            model: this.getUsersModel(),
            attributes: this.getUsersModel().getFieldsForPreview(),
            raw: true,
        };
        if (alias) {
            include.as = alias;
        }
        return include;
    }
    /**
     *
     * @return {Object}
     */
    static getIncludeAuthorForPreview(required = true) {
        return {
            required,
            model: this.getUsersModel(),
            attributes: this.getUsersModel().getFieldsForPreview(),
        };
    }
    /**
     *
     * @return {string}
     */
    static getUsersSingularName() {
        return 'User';
    }
    /**
     *
     * @return {Object}
     */
    static getUsersTeamIncludeWithUsersOnly(entityName, status = null) {
        const where = {
            entity_name: entityName,
        };
        if (status !== null) {
            where.status = status;
        }
        return {
            where,
            model: this.getUsersTeamModel(),
            as: this.getUsersTeamTableName(),
            required: false,
            include: [
                this.getIncludeUsersPreview(),
            ],
        };
    }
}
module.exports = UsersModelProvider;
