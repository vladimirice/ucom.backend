"use strict";
const errors_1 = require("../../api/errors");
class EntityImagesInputValidator {
    static validate(entityImages) {
        if (entityImages.length > 1000) {
            throw new errors_1.BadRequestError('Max allowed entity_images string length is 1000 symbols');
        }
        return true;
    }
}
module.exports = EntityImagesInputValidator;
