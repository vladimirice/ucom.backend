"use strict";
const errors_1 = require("../../api/errors");
const knex = require("../../../config/knex");
class RepositoryHelper {
    static getPrefixedAttributes(attributes, tableName, prefixForAlias = '') {
        return attributes.map(attribute => `${tableName}.${attribute} AS ${prefixForAlias}${attribute}`);
    }
    static getKnexCountAsNumber(res) {
        return res.length === 0 ? 0 : +res[0].amount;
    }
    static getKnexOneIdReturningOrException(res) {
        if (res.length !== 1) {
            throw new errors_1.AppError('It is supposed that getKnexOneIdReturning res contains one element');
        }
        this.convertStringFieldsToNumbers(res[0], ['id'], ['id']);
        return res[0].id;
    }
    static hydrateObjectForManyEntities(data, objectPrefix, delimiter = '__') {
        data.forEach((item) => {
            this.hydrateOneObject(item, objectPrefix, delimiter);
        });
    }
    static hydrateOneObject(data, objectPrefix, delimiter = '__') {
        const obj = {};
        const fieldsToDelete = [];
        for (const field in data) {
            if (!data.hasOwnProperty(field)) {
                continue;
            }
            if (field.includes(objectPrefix)) {
                const objField = field.replace(objectPrefix, '');
                obj[objField] = data[field];
                fieldsToDelete.push(field);
            }
        }
        fieldsToDelete.forEach((field) => {
            delete data[field];
        });
        const objectKey = objectPrefix.replace(delimiter, '');
        data[objectKey] = obj;
    }
    static convertStringFieldsToNumbersForArray(models, fields, fieldsToDisallowZero = []) {
        models.forEach(model => this.convertStringFieldsToNumbers(model, fields, fieldsToDisallowZero));
    }
    // It is required because big int fields from Postgresql are represented as string
    // It is supposed that js numerical limit will not be exceeded before a bigint support feature of nodejs core will be created
    static convertStringFieldsToNumbers(model, fields, fieldsToDisallowZero = []) {
        fields.forEach((field) => {
            const processed = +model[field];
            if (!Number.isFinite(processed)) {
                throw new errors_1.AppError(`Number is not finite. Field name is: ${field}, basic value is: ${model[field]}`, 500);
            }
            if (~fieldsToDisallowZero.indexOf(field) && processed === 0) {
                throw new errors_1.AppError(`It is not allowed for ${field} to be zero. Initial value is: ${model[field]}`, 500);
            }
            model[field] = processed;
        });
    }
    static splitAggregates(row, delimiter = '__') {
        const aggregates = {};
        row.array_agg.forEach((aggregate) => {
            const [type, value] = aggregate.split(delimiter);
            aggregates[type] = +value;
        });
        return aggregates;
    }
    static async updateManyRowsByNumberToNumber(toProcess, params, batchSize = 100) {
        let counter = 0;
        let whenThenString = ' ';
        let filterValues = [];
        const promises = [];
        for (const entityId in toProcess) {
            if (!toProcess.hasOwnProperty(entityId)) {
                continue;
            }
            whenThenString += this.getWhenNumberThenNumber(params.whenFieldName, +entityId, toProcess[entityId][params.thenFieldNameFromSet]);
            filterValues.push(+entityId);
            counter += 1;
            if (counter % batchSize === 0) {
                promises.push(this.updateTableValuesByWhenThen(params.tableName, params.fieldNameToSet, whenThenString, params.whenFieldName, filterValues));
                counter = 0;
                whenThenString = ' ';
                filterValues = [];
            }
        }
        if (whenThenString !== ' ') {
            promises.push(this.updateTableValuesByWhenThen(params.tableName, params.fieldNameToSet, whenThenString, params.whenFieldName, filterValues));
        }
        // #task - also implement promises batch
        await Promise.all(promises);
    }
    static getWhenNumberThenNumber(fieldName, whenValue, thenValue) {
        return ` WHEN ${fieldName} = ${whenValue} THEN ${thenValue}`;
    }
    static async updateTableValuesByWhenThen(tableName, fieldNameToSet, whenThenString, filterFieldName, filterValues) {
        const sql = `
      UPDATE ${tableName}
        SET ${fieldNameToSet} = CASE ${whenThenString} END,
        updated_at = NOW()
        WHERE ${filterFieldName} IN (${filterValues.join(', ')})
    `;
        await knex.raw(sql);
    }
}
module.exports = RepositoryHelper;
