"use strict";
class RepositoryHelper {
    static convertStringFieldsToNumbers(model, repository) {
        const fields = repository.getNumericalFields();
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
