import { BadRequestError } from '../../api/errors';
import { StringToAnyCollection } from '../../common/interfaces/common-types';

const fs = require('fs');
const config = require('config');

import ImageTypeValidator = require('../validator/image-type-validator');

const {
  imageFieldName,
  storageDirPrefix,
  storageFullPath,
} = require('../middleware/upload-one-image-middleware');

const validationRules: StringToAnyCollection = config.uploader.images.validation_rules;

class UploaderImagesService {
  public static processOneImage(req: any): any {
    const { filename } = req.files[imageFieldName][0];
    const filePath = `${storageFullPath}/${filename}`;

    this.validateOneImage(filePath);

    const rootUrl = config.get('host').root_url;
    const prefix = `${rootUrl}${storageDirPrefix}`;

    return {
      files: [
        {
          url: `${prefix}/${filename}`,
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
