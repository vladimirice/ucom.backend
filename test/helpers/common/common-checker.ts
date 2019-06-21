import { CheckManyObjectsOptionsDto, ObjectInterfaceRulesDto } from '../../interfaces/options-interfaces';
import { ListResponse } from '../../../lib/common/interfaces/lists-interfaces';
import { StringToAnyCollection } from '../../../lib/common/interfaces/common-types';

import ResponseHelper = require('../../integration/helpers/response-helper');

const _ = require('lodash');

require('jest-expect-message');

class CommonChecker {
  public static expectFieldNotToBeNull(model: any, field: string) {
    // @ts-ignore
    expect(model[field], `${field} is null`).not.toBeNull();
  }

  public static expectFieldToBePositiveOrZeroNumber(model: any, field: string) {
    this.expectFieldNotToBeNull(model, field);
    // @ts-ignore
    expect(typeof model[field], `${field} is not a number. It is: ${typeof model[field]}`).toBe('number');
    // @ts-ignore
    expect(model[field]).toBeGreaterThanOrEqual(0);
  }

  public static expectModelIdsExistenceInResponseList(
    response: ListResponse,
    expectedModelIds: number[],
    expectedTotalAmount: number | null = null,
  ) {
    this.expectModelsExistence(response.data, expectedModelIds);

    if (expectedTotalAmount !== null) {
      expect(response.metadata.total_amount).toBe(expectedTotalAmount);
    }
  }

  public static expectModelsExistence(
    actualModels,
    expectedModelIds: number[],
    checkOrdering: boolean = false,
  ): void {
    expect(actualModels.length).toBe(expectedModelIds.length);

    expectedModelIds.forEach((expectedId) => {
      expect(actualModels.some(actual => actual.id === expectedId)).toBeTruthy();
    });

    if (checkOrdering) {
      ResponseHelper.checkOrderingById(actualModels, expectedModelIds);
    }
  }

  public static expectModelIdsDoNotExistInResponseList(
    response: ListResponse,
    expectedModelIds: number[],
  ) {
    this.expectModelsDoNotExist(response.data, expectedModelIds);
  }

  public static expectModelsDoNotExist(
    actualModels: any[],
    expectedModelIds: number[],
  ): void {
    expectedModelIds.forEach((expectedId) => {
      expect(actualModels.some(actual => actual.id === expectedId)).toBeFalsy();
    });
  }

  public static expectAllFieldsExistenceForObjectsArray(
    arr: StringToAnyCollection[],
    expected: string[],
  ): void {
    for (const item of arr) {
      this.expectAllFieldsExistence(item, expected);
    }
  }

  public static expectAllFieldsExistence(
    actualObject: StringToAnyCollection,
    expected: string[],
  ): void {
    const actualKeys = Object.keys(actualObject).sort();

    const expectedSorted = expected.sort();

    expect(actualKeys).toEqual(expectedSorted);
  }

  public static expectPositiveNonZeroInteger(value: any): void {
    expect(typeof value).toBe('number');
    expect(value).toBeGreaterThan(0);
  }

  public static expectNotEmpty(object: any): void {
    expect(_.isEmpty(object)).toBeFalsy();
  }

  public static expectNotEmptyArray(array: any): void {
    expect(Array.isArray(array)).toBeTruthy();
    expect(array.length).toBeGreaterThan(0);
  }

  public static expectEmpty(object: any) {
    expect(_.isEmpty(object)).toBeTruthy();
  }

  public static expectOnlyOneNotEmptyItem(array: any[]): void {
    this.expectNotEmptyArray(array);
    expect(array.length).toBe(1);

    this.expectNotEmpty(array[0]);
  }

  public static expectOnlyOneArrayItemForTheList(object: ListResponse) {
    expect(object.data.length).toBe(1);
    expect(object.metadata.total_amount).toBe(1);
    expect(object.metadata.has_more).toBe(false);
  }

  public static expectOnlyTwoArrayItemForTheList(object: ListResponse) {
    expect(object.data.length).toBe(2);
    expect(object.metadata.total_amount).toBe(2);
    expect(object.metadata.has_more).toBe(false);
  }

  public static checkArrayOfObjectsInterface(
    manyActualObjects: any[],
    objectInterfaceRules: ObjectInterfaceRulesDto,
    options: CheckManyObjectsOptionsDto,
  ): void {
    expect(Array.isArray(manyActualObjects)).toBeTruthy();

    this.expectNotEmpty(manyActualObjects);

    for (const oneObject of manyActualObjects) {
      this.checkOneObjectInterface(oneObject, objectInterfaceRules, options);
    }
  }

  public static checkOneObjectInterface(
    oneObject: any,
    objectInterfaceRules: ObjectInterfaceRulesDto,
    options: CheckManyObjectsOptionsDto,
  ) {
    this.expectNotEmpty(oneObject);

    if (options.exactKeysAmount) {
      expect(Object.keys(oneObject).sort()).toEqual(Object.keys(objectInterfaceRules).sort());
    }

    for (const key in objectInterfaceRules) {
      if (!objectInterfaceRules.hasOwnProperty(key)) {
        continue;
      }

      switch (objectInterfaceRules[key].type) {
        case 'number':
          expect(oneObject[key]).toBeGreaterThanOrEqual(objectInterfaceRules[key].length);
          expect(Number.isFinite(oneObject[key])).toBeTruthy();
          // @ts-ignore
          expect(typeof oneObject[key], `Wrong type of key ${key}. Object: ${JSON.stringify(oneObject)}`)
            .toBe(objectInterfaceRules[key].type);
          break;
        case 'string':
          expect(oneObject[key].length).toBeGreaterThanOrEqual(objectInterfaceRules[key].length);
          // @ts-ignore
          expect(typeof oneObject[key], `Wrong type of key ${key}. Object: ${JSON.stringify(oneObject)}`)
            .toBe(objectInterfaceRules[key].type);
          break;
        case 'string_array':
          expect(oneObject[key].length).toBeGreaterThanOrEqual(objectInterfaceRules[key].length);
          expect(Array.isArray(oneObject[key])).toBeTruthy();
          break;
        default:
          throw new TypeError(`Unsupported expected type: ${objectInterfaceRules[key].type}`);
      }

      if (typeof objectInterfaceRules[key].value !== 'undefined') {
        expect(oneObject[key]).toBe(objectInterfaceRules[key].value);
      }
    }
  }

  // eslint-disable-next-line sonarjs/cognitive-complexity
  public static checkManyObjectsInterface(
    manyActualObjects: any,
    objectInterfaceRules: ObjectInterfaceRulesDto,
    options: CheckManyObjectsOptionsDto,
  ): void {
    expect(typeof manyActualObjects).toBe('object');
    expect(Array.isArray(manyActualObjects)).toBeFalsy();

    this.expectNotEmpty(manyActualObjects);

    for (const actualKey in manyActualObjects) {
      if (!manyActualObjects.hasOwnProperty(actualKey)) {
        continue;
      }

      const oneObject = manyActualObjects[actualKey];

      this.checkOneObjectInterface(oneObject, objectInterfaceRules, options);
    }
  }
}

export = CommonChecker;
