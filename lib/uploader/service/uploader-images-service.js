"use strict";
const errors_1 = require("../../api/errors");
const fs = require('fs');
const config = require('config');
const ImageTypeValidator = require("../validator/image-type-validator");
const UploaderImagesHelper = require("../helper/uploader-images-helper");
const { imageFieldName, } = require('../middleware/upload-one-image-middleware');
const validationRules = config.uploader.images.validation_rules;
class UploaderImagesService {
    static processOneImage(req) {
        const { path: filePath } = req.files[imageFieldName][0];
        this.validateOneImage(filePath);
        const relativeFileName = UploaderImagesHelper.getRelativeFilenameForUrl(filePath);
        const hostWithHttps = config.get('servers').uploader;
        const url = `${hostWithHttps}${relativeFileName}`;
        return {
            files: [
                {
                    url,
                },
            ],
        };
    }
    static validateOneImage(filePath) {
        const extension = ImageTypeValidator.validateExtension(filePath, Object.keys(validationRules));
        if (extension === null) {
            this.processValidationError(filePath, `Unsupported file extension, determined by internal file structure. Allowed ones are: ${Object.keys(validationRules).join(', ')}`);
        }
        if (!ImageTypeValidator.validateSize(filePath, validationRules[extension].max_size_in_bytes)) {
            this.processValidationError(filePath, `File is too large. Max limit for extension ${extension} is: ${validationRules[extension].max_size_in_bytes / 1024 / 1024} Mb`);
        }
    }
    static processValidationError(filePath, message) {
        // eslint-disable-next-line security/detect-non-literal-fs-filename
        fs.unlinkSync(filePath); // #security - delete on background
        throw new errors_1.BadRequestError(message);
    }
}
module.exports = UploaderImagesService;
