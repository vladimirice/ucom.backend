"use strict";
const errors_1 = require("../../api/errors");
const EntityImagesInputValidator = require("../validator/entity-images-input-validator");
const EntityImagesModelProvider = require("./entity-images-model-provider");
const fieldName = EntityImagesModelProvider.entityImagesColumn();
class EntityImageInputService {
    static setEmptyEntityImages(model) {
        model[fieldName] = {};
    }
    static addEntityImageFieldFromBodyOrException(model, body) {
        if (typeof body.main_image_filename !== 'undefined') {
            throw new errors_1.BadRequestError('main_image_filename field is forbidden for the given case. Do not provide it at all');
        }
        this.addEntityImageFieldOrException(model, body[fieldName]);
    }
    static processEntityImageOrMakeItEmpty(body) {
        const inputValue = body[fieldName];
        if (typeof inputValue === 'undefined') {
            this.setEmptyEntityImages(body);
            return;
        }
        this.addEntityImageFromRequest(body, inputValue);
    }
    static addEntityImageFieldOrException(model, inputValue) {
        if (typeof inputValue === 'undefined') {
            throw new errors_1.BadRequestError('entity_images field must be provided. For empty value please provide empty object {}');
        }
        this.addEntityImageFromRequest(model, inputValue);
    }
    static addEntityImageFromRequest(model, inputValue) {
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
