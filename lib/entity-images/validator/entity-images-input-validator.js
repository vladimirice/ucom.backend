"use strict";
const errors_1 = require("../../api/errors");
class EntityImagesInputValidator {
    static validateStringInput(entityImages) {
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
