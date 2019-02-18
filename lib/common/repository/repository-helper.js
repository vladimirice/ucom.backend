"use strict";
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
}
module.exports = RepositoryHelper;
