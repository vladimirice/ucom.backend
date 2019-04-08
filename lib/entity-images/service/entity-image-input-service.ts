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
    this.addEntityImageFieldOrException(model, body[fieldName]);
  }

  private static addEntityImageFieldOrException(
    model: ModelWithEntityImages,
    inputValue: string | undefined,
  ): void {
    if (typeof inputValue === 'undefined') {
      return;
    }

    EntityImagesInputValidator.validate(inputValue);

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

    model[fieldName] = parsed;
  }
}

export = EntityImageInputService;
