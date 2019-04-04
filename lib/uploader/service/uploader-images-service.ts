import { BadRequestError } from '../../api/errors';
import { StringToAnyCollection } from '../../common/interfaces/common-types';

const fs = require('fs');
const config = require('config');

import ImageTypeValidator = require('../validator/image-type-validator');
import UploaderImagesHelper = require('../helper/uploader-images-helper');

const {
  imageFieldName,
} = require('../middleware/upload-one-image-middleware');

const validationRules: StringToAnyCollection = config.uploader.images.validation_rules;

class UploaderImagesService {
  public static processOneImage(req: any): any {
    const { path:filePath } = req.files[imageFieldName][0];

    this.validateOneImage(filePath);

    const relativeFileName: string = UploaderImagesHelper.getRelativeFilenameForUrl(filePath);

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

  private static validateOneImage(filePath: string): void {
    const extension: string | null = ImageTypeValidator.validateExtension(filePath, Object.keys(validationRules));

    if (extension === null) {
      this.processValidationError(
        filePath,
        `Unsupported file extension, determined by internal file structure. Allowed ones are: ${Object.keys(validationRules).join(', ')}`,
      );
    }

    if (!ImageTypeValidator.validateSize(filePath, validationRules[extension!].max_size_in_bytes)) {
      this.processValidationError(
        filePath,
        `File is too large. Max limit for extension ${extension} is: ${validationRules[extension!].max_size_in_bytes / 1024 / 1024} Mb`,
      );
    }
  }

  private static processValidationError(filePath: string, message: string): void {
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    fs.unlinkSync(filePath); // #security - delete on background

    throw new BadRequestError(message);
  }
}

export = UploaderImagesService;
