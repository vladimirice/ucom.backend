import { BadRequestError } from '../../api/errors';

class EntityImagesInputValidator {
  public static validate(entityImages: string): boolean {
    if (entityImages.length > 1000) {
      throw new BadRequestError('Max allowed entity_images string length is 1000 symbols');
    }

    return true;
  }
}

export = EntityImagesInputValidator;
