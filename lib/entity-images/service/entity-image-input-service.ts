import { ModelWithEntityImages } from '../interfaces/model-interfaces';
import { BadRequestError } from '../../api/errors';

import EntityImagesInputValidator = require('../validator/entity-images-input-validator');
import EntityImagesModelProvider = require('./entity-images-model-provider');

const fieldName = EntityImagesModelProvider.entityImagesColumn();

class EntityImageInputService {
  public static addEntityImageFieldFromBodyOrException(
    model: ModelWithEntityImages,
    body: any,
  ): void {
    if (typeof body.main_image_filename !== 'undefined') {
      throw new BadRequestError('main_image_filename field is forbidden for the given case. Do not provide it at all');
    }

    this.addEntityImageFieldOrException(model, body[fieldName]);
  }

  private static addEntityImageFieldOrException(
    model: ModelWithEntityImages,
    inputValue: string | undefined,
  ): void {
    if (typeof inputValue === 'undefined') {
      throw new BadRequestError('entity_images field must be provided. For empty value please provide empty object {}');
    }

    EntityImagesInputValidator.validateStringInput(inputValue);

    let parsed;
    try {
      parsed = JSON.parse(inputValue);
    } catch (error) {
      if (error.name === 'SyntaxError') {
        throw new BadRequestError({
          [fieldName]: error.message,
        });
      }

      throw error;
    }

    EntityImagesInputValidator.validateParsedInput(parsed);

    model[fieldName] = parsed;
  }
}

export = EntityImageInputService;
