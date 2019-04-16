"use strict";
const errors_1 = require("../../api/errors");
class EntityImagesInputValidator {
    static validateStringInput(entityImages) {
        if (typeof entityImages !== 'string') {
            throw new errors_1.BadRequestError('It is required to provide entity_images as serialized JSON (string)');
        }
        if (entityImages.length > 1000) {
            throw new errors_1.BadRequestError('Max allowed entity_images string length is 1000 symbols');
        }
        return true;
    }
    static validateParsedInput(entityImages) {
        if (Array.isArray(entityImages)) {
            throw new errors_1.BadRequestError('Root element must to be an object, not an array.');
        }
        return true;
    }
}
module.exports = EntityImagesInputValidator;
