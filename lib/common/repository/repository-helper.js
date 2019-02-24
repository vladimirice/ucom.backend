"use strict";
const knex = require("../../../config/knex");
class RepositoryHelper {
    // It is required because big int fields from Postgresql are represented as string
    // It is supposed that js numerical limit will not be exceeded before a bigint support feature of nodejs core will be created
    static convertStringFieldsToNumbers(model, fields) {
        fields.forEach((field) => {
            model[field] = +model[field];
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
