"use strict";
const errors_1 = require("../../api/errors");
const EntityImagesInputValidator = require("../validator/entity-images-input-validator");
const EntityImagesModelProvider = require("./entity-images-model-provider");
const fieldName = EntityImagesModelProvider.entityImagesColumn();
class EntityImageInputService {
    static addEntityImageFieldFromBodyOrException(model, body) {
        this.addEntityImageFieldOrException(model, body[fieldName]);
    }
    static addEntityImageFieldOrException(model, inputValue) {
        if (typeof inputValue === 'undefined') {
            return;
        }
        EntityImagesInputValidator.validateStringInput(inputValue);
        let parsed;
        try {
            parsed = JSON.parse(inputValue);
        }
        catch (error) {
            if (error.name === 'SyntaxError') {
                throw new errors_1.BadRequestError({
                    [fieldName]: error.message,
                });
            }
            throw error;
        }
        EntityImagesInputValidator.validateParsedInput(parsed);
        model[fieldName] = parsed;
    }
}
module.exports = EntityImageInputService;
