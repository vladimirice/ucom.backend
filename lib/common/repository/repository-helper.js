"use strict";
class RepositoryHelper {
    static convertStringFieldsToNumbers(model, repository) {
        const fields = repository.getNumericalFields();
        fields.forEach((field) => {
            model[field] = +model[field];
        });
    }
}
module.exports = RepositoryHelper;
