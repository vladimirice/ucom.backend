import { BadRequestError } from '../../api/errors';

class EntityImagesInputValidator {
  public static validateStringInput(entityImages: string): boolean {
    if (entityImages.length > 1000) {
      throw new BadRequestError('Max allowed entity_images string length is 1000 symbols');
    }

    return true;
  }

  public static validateParsedInput(entityImages: any): boolean {
    if (Array.isArray(entityImages)) {
      throw new BadRequestError('Root element must to be an object, not an array.');
    }

    return true;
  }
}

export = EntityImagesInputValidator;
