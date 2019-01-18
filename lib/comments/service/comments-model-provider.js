"use strict";
const models = require('../../../models');
const ENTITY_NAME = 'comments  ';
const TABLE_NAME = 'comments';
class CommentsModelProvider {
    /**
     *
     * @return {string}
     */
    static getEntityName() {
        return ENTITY_NAME;
    }
    /**
     *
     * @return {string}
     */
    static getModelName() {
        return TABLE_NAME;
    }
    /**
     *
     * @return {Object}
     */
    static getModel() {
        return models[TABLE_NAME];
    }
    /**
     *
     * @return {string}
     */
    static getCommentsSingularName() {
        return 'comment';
    }
    /**
     *
     * @return {string}
     */
    static getCommentsTableName() {
        return TABLE_NAME;
    }
    static getTableName() {
        return this.getCommentsTableName();
    }
    /**
     *
     * @return {string[]}
     */
    static getCommentsFieldsForPreview() {
        return this.getModel().getFieldsForPreview();
    }
    /**
     *
     * @param {string} entityName
     * @return {boolean}
     */
    static isComment(entityName) {
        return entityName === this.getEntityName();
    }
}
module.exports = CommentsModelProvider;
