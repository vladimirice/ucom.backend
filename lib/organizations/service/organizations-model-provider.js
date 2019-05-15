"use strict";
const OrganizationsFieldsSet = require("../models/organizations-fields-set");
const models = require('../../../models');
const ENTITY_NAME = 'org       ';
const TABLE_NAME = 'organizations';
class OrganizationsModelProvider {
    static getOrgFieldsForPreview() {
        return this.getModel().getFieldsForPreview();
    }
    static getEntityName() {
        return ENTITY_NAME;
    }
    static getCurrentParamsTableName() {
        return 'organizations_current_params';
    }
    /**
     *
     * @return {string}
     */
    static getOrganizationSingularName() {
        return 'organization';
    }
    /**
     *
     * @return {string}
     */
    static getModelName() {
        return TABLE_NAME;
    }
    static getTableName() {
        return TABLE_NAME;
    }
    // noinspection JSUnusedGlobalSymbols
    static getBlockchainIdFieldName() {
        return 'blockchain_id';
    }
    /**
     *
     * @return {Object}
     */
    static getModel() {
        return models[TABLE_NAME];
    }
    static getCurrentParamsInclude() {
        return {};
    }
    /**
     *
     * @return {Object}
     */
    static getIncludeForPreview(required = false) {
        return {
            required,
            model: this.getModel(),
            attributes: this.getModel().getFieldsForPreview(),
        };
    }
    static getOrganizationsRelatedFieldsSet() {
        return OrganizationsFieldsSet.getAllFieldsSet();
    }
}
module.exports = OrganizationsModelProvider;
