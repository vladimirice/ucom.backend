import { ModelWithEntityImages } from '../interfaces/model-interfaces';
import { BadRequestError } from '../../api/errors';
import { IRequestBody } from '../../common/interfaces/common-types';

import EntityImagesInputValidator = require('../validator/entity-images-input-validator');
import EntityImagesModelProvider = require('./entity-images-model-provider');

const fieldName = EntityImagesModelProvider.entityImagesColumn();

class EntityImageInputService {
  public static setEmptyEntityImages(model: any): void {
    model[fieldName] = {};
  }

  public static addEntityImageFieldFromBodyOrException(
    model: ModelWithEntityImages,
    body: any,
  ): void {
    if (typeof body.main_image_filename !== 'undefined') {
      throw new BadRequestError('main_image_filename field is forbidden for the given case. Do not provide it at all');
    }

    this.addEntityImageFieldOrException(model, body[fieldName]);
  }

  public static processEntityImageOrMakeItEmpty(
    body: IRequestBody,
  ): void {
    const inputValue = body[fieldName];

    if (typeof inputValue === 'undefined') {
      this.setEmptyEntityImages(body);

      return;
    }

    this.addEntityImageFromRequest(<ModelWithEntityImages>body, inputValue);
  }

  private static addEntityImageFieldOrException(
    model: ModelWithEntityImages,
    inputValue: string | undefined,
  ): void {
    if (typeof inputValue === 'undefined') {
      throw new BadRequestError('entity_images field must be provided. For empty value please provide empty object {}');
    }

    this.addEntityImageFromRequest(model, inputValue);
  }

  private static addEntityImageFromRequest(
    model: ModelWithEntityImages,
    inputValue: string,
  ): void {
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
