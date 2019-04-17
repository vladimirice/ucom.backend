import { BadRequestError } from '../../api/errors';

class EntityImagesInputValidator {
  public static validateStringInput(entityImages: string): boolean {
    if (typeof entityImages !== 'string') {
      throw new BadRequestError('It is required to provide entity_images as serialized JSON (string)');
    }

    if (entityImages === 'null') {
      throw new BadRequestError('null is not a valid value for entity_images');
    }

    if (entityImages.length > 1000) {
      throw new BadRequestError('Max allowed entity_images string length is 1000 symbols');
    }

    return true;
  }

  public static validateParsedInput(entityImages: any): boolean {
    if (entityImages === null) {
      throw new BadRequestError('Null value is not allowed for entity_images. Please, provide an empty object {} instead');
    }

    if (Array.isArray(entityImages)) {
      throw new BadRequestError('Root element must to be an object, not an array.');
    }

    return true;
  }
}

export = EntityImagesInputValidator;
