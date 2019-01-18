"use strict";
/* tslint:disable:max-line-length */
const joi = require('joi');
const { JoiBadRequestError } = require('../../api/errors');
const _ = require('lodash');
class UpdateManyToManyHelper {
    /**
     *
     * @param {Object[]} source
     * @param {Object[]} updated
     * @param {string} sourceIdField
     * @param {string} updatedIdField
     * @return {Object[]}
     */
    static getCreateDeleteOnlyDelta(source, updated, sourceIdField = 'id', updatedIdField = 'id') {
        const added = updated.filter((updatedItem) => {
            return source.find(sourceItem => +sourceItem[sourceIdField] === +updatedItem[updatedIdField]) === undefined;
        });
        const deleted = source.filter(sourceItem => updated.find(updatedItem => +sourceItem[sourceIdField] === +updatedItem[updatedIdField]) === undefined);
        return {
            added,
            deleted,
        };
    }
    /**
     *
     * @param {Object[]} source
     * @param {Object[]} updated
     * @return {Object[]}
     */
    static getCreateUpdateDeleteDelta(source, updated) {
        const added = updated.filter((updatedItem) => {
            if (!updatedItem['id']) {
                return true;
            }
            return source.find(sourceItem => +sourceItem.id === +updatedItem.id) === undefined;
        });
        const changed = updated.filter((updatedItem) => {
            return source.some(sourceItem => +sourceItem.id === +updatedItem.id);
        });
        const deleted = source.filter((sourceItem) => {
            return !updated.some(updatedItem => +updatedItem.id === +sourceItem.id);
        });
        return {
            added,
            changed,
            deleted,
        };
    }
    /**
     *
     * @param {Object} model
     * @param {Object[]}  deltaData
     * @param {Object} appendDataForNew
     * @param {Object}    transaction
     * @return {Promise<boolean>}
     */
    static async updateSourcesByDelta(model, deltaData, appendDataForNew, transaction) {
        const creationPromises = this.getCreationPromises(model, deltaData, appendDataForNew, transaction);
        const updatePromises = this.getUpdatePromises(model, deltaData, transaction);
        const deletionPromises = this.getDeletionPromises(model, deltaData, transaction);
        return Promise.all(_.concat(creationPromises, updatePromises, deletionPromises));
    }
    /**
     *
     * @param {Object} deltaData
     * @param {Object} creationValidationSchema
     * @param {Object} updatingValidationSchema
     */
    static filterDeltaDataBeforeSave(deltaData, creationValidationSchema, updatingValidationSchema) {
        deltaData.added = this.filterManySources(deltaData.added, creationValidationSchema);
        deltaData.changed = this.filterManySources(deltaData.changed, updatingValidationSchema);
    }
    /**
     *
     * @param {Object} model - sequelize model
     * @param {Object} deltaData
     * @param {Object} appendDataForNew
     * @param {Object} transaction
     * @return {Promise[]}
     * @private
     */
    static getCreationPromises(model, deltaData, appendDataForNew, transaction) {
        const promises = [];
        deltaData.added.forEach((data) => {
            promises.push(model.create(Object.assign({}, data, appendDataForNew), { transaction }));
        });
        return promises;
    }
    /**
     *
     * @param {Object} model - sequelize model
     * @param {Object} deltaData
     * @param {Object} transaction
     * @return {Promise[]}
     * @private
     */
    static getUpdatePromises(model, deltaData, transaction) {
        const promises = [];
        deltaData.changed.forEach((data) => {
            promises.push(model.update(data, {
                transaction,
                where: {
                    id: data.id,
                },
            }));
        });
        return promises;
    }
    /**
     *
     * @param {Object} model - sequelize model
     * @param {Object} deltaData
     * @param {Object} transaction
     * @return {Promise[]}
     * @private
     */
    static getDeletionPromises(model, deltaData, transaction) {
        const promises = [];
        deltaData.deleted.forEach((data) => {
            const promise = model.destroy({
                transaction,
                where: {
                    id: data.id,
                },
            });
            promises.push(promise);
        });
        return promises;
    }
    /**
     *
     * @param {Object[]} updatedModels
     * @param {Object} joiSchema
     * @return {Object[]}
     * @private
     */
    static filterManySources(updatedModels, joiSchema) {
        return updatedModels.map((source) => {
            return this.filterOneSource(source, joiSchema);
        });
    }
    /**
     *
     * @param {Object} source
     * @param {Object} joiSchema
     * @private
     */
    static filterOneSource(source, joiSchema) {
        const { error, value } = joi.validate(source, joiSchema, {
            allowUnknown: true,
            abortEarly: false,
            stripUnknown: true,
        });
        if (error) {
            throw new JoiBadRequestError(error);
        }
        return value;
    }
}
module.exports = UpdateManyToManyHelper;
