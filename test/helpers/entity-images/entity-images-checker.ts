import { ModelWithEntityImages } from '../../../lib/entity-images/interfaces/model-interfaces';
import { StringToAnyCollection } from '../../../lib/common/interfaces/common-types';

import EntityImagesModelProvider = require('../../../lib/entity-images/service/entity-images-model-provider');
import ResponseHelper = require('../../integration/helpers/response-helper');
import EntityImagesGenerator = require('../../generators/common/entity-images-generator');

class EntityImagesChecker {
  public static checkIsEmptyForOneModel(model: ModelWithEntityImages): void {
    return this.checkForOneModel(model, {});
  }

  public static checkSampleEntityImagesForModel(model: ModelWithEntityImages): void {
    const sample = EntityImagesGenerator.getObjectWithEntityImages();

    this.checkForOneModel(model, sample.entity_images);
  }

  public static checkForOneModel(model: ModelWithEntityImages, expectedValue: StringToAnyCollection): void {
    const field: string = EntityImagesModelProvider.entityImagesColumn();

    const value: StringToAnyCollection = model[field];

    ResponseHelper.expectToBeObject(model[field]);

    expect(value).toMatchObject(expectedValue);
  }
}

export = EntityImagesChecker;
