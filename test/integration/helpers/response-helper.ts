/* eslint-disable unicorn/no-for-loop */
/* tslint:disable:max-line-length */
import { ListMetadata, ListResponse } from '../../../lib/common/interfaces/lists-interfaces';
import { PostsListResponse } from '../../../lib/posts/interfaces/model-interfaces';

import _ = require('lodash');

require('jest-expect-message');

class ResponseHelper {
  public static expectErrorMatchMessage(res, msg: string, statusCode: number = 400) {
    expect(res.status).toBe(statusCode);
    expect(res.body.errors).toMatch(msg);
  }

  public static checkOrderingById(actual: any[], expected: number[]): void {
    expect(expected.length).toBe(actual.length);

    for (let i = 0; i < actual.length; i += 1) {
      expect(+actual[i].id).toBe(+expected[i]);
    }
  }

  public static checkResponseOrderingForList(
    response: PostsListResponse,
    expected: any,
    orderedField: string,
    offset: number = 0,
  ): void {
    expect(_.isEmpty(response.data)).toBeFalsy();

    for (let i = offset; i < response.data.length; i += 1) {
      expect(response.data[i].id).toBe(expected[i][orderedField]);
    }
  }

  public static checkFieldsAreNumerical(model: any, fields: string[]) {
    fields.forEach((field) => {
      expect(typeof model[field]).toBe('number');
    });
  }

  public static checkCreatedAtUpdatedAtFormat(model) {
    expect(model.created_at).toMatch('Z');
    expect(model.created_at).toMatch('T');

    expect(model.updated_at).toMatch('Z');
    expect(model.updated_at).toMatch('T');
  }

  static expectStatusOk(res) {
    // @ts-ignore
    expect(res.status, `Body is: ${JSON.stringify(res.body, null, 2)}`).toBe(200);
  }

  static expectStatusTempRedirect(res) {
    // @ts-ignore
    expect(res.status, `Body is: ${JSON.stringify(res.body, null, 2)}`).toBe(302);
  }

  static expectStatusCreated(res) {
    // @ts-ignore
    expect(res.status, `Body is: ${JSON.stringify(res.body, null, 2)}`).toBe(201);
  }

  static expectStatusNotFound(res) {
    // @ts-ignore
    expect(res.status, `Body is: ${JSON.stringify(res.body, null, 2)}`).toBe(404);
  }

  static expectStatusBadRequest(res) {
    // @ts-ignore
    expect(res.status, `Body is: ${JSON.stringify(res.body, null, 2)}`).toBe(400);
  }

  static expectStatusUnauthorized(res) {
    // @ts-ignore
    expect(res.status, `Body is: ${JSON.stringify(res.body, null, 2)}`).toBe(401);
  }

  static expectStatusForbidden(res) {
    // @ts-ignore
    expect(res.status, `Body is: ${JSON.stringify(res.body, null, 2)}`).toBe(403);
  }

  /**
   *
   * @param {Object} res
   * @param {number} status
   */
  static expectStatusToBe(res, status) {
    // @ts-ignore
    expect(res.status, `Body is: ${JSON.stringify(res.body, null, 2)}`).toBe(status);
  }

  // noinspection JSUnusedGlobalSymbols
  /**
   *
   * @param {Object} res
   * @param {Object} invalidFields
   */
  static checkValidErrorResponse(res, invalidFields) {
    const errorsArray = res.body.errors;

    expect(errorsArray).toBeDefined();

    invalidFields.forEach((field) => {
      const target = errorsArray.find(err => err.field === field);
      expect(target).toBeDefined();
      expect(target.message).toBeDefined();
      expect(target.message).toMatch(field);
    });
  }

  // noinspection JSUnusedGlobalSymbols
  static compareObjectArrays(expected, actual) {
    expect(actual.length).toBe(expected.length);

    expected.forEach((post) => {
      const existed = actual.find(data => data.id === post.id);

      expect(existed).toBeDefined();
      expect(JSON.stringify(existed)).toBe(JSON.stringify(post));
    });
  }

  /**
   *
   * @param {Object[]} actualArray
   * @param {string[]} expectedInEvery
   */
  static expectAllFieldsExistenceForArray(actualArray, expectedInEvery) {
    actualArray.forEach((model) => {
      this.expectAllFieldsExistence(model, expectedInEvery);
    });
  }

  /**
   *
   * @deprecated
   * @see CommonChecker.expectAllFieldsExistence()
   * @param {Object} actual
   * @param {string[]} expected
   */
  static expectAllFieldsExistence(actual, expected) {
    const actualKeys = Object.keys(actual).sort();

    const expectedSorted = expected.sort();

    expect(actualKeys).toEqual(expectedSorted);
  }

  /**
   *
   * @param {Object} actual
   * @param {string[]} notExpected
   */
  static expectFieldsDoesNotExist(actual, notExpected) {
    const actualFields = Object.keys(actual);

    notExpected.forEach((field) => {
      expect(actualFields[field]).not.toBeDefined();
    });
  }

  /**
   *
   * @param {Object} actual
   * @param {string[]} expected
   */
  static expectFieldsAreNotNull(actual, expected) {
    expected.forEach((field) => {
      // @ts-ignore
      expect(actual[field], `Field ${field} is not defined. Object is ${JSON.stringify(actual, null, 2)}`).toBeDefined();
      // @ts-ignore
      expect(actual[field], `Field ${field} is null. Object is ${JSON.stringify(actual, null, 2)}`).not.toBeNull();
    });
  }

  /**
   *
   * @param {Object} actual
   * @param {string[]} expected
   */
  static expectFieldsAreExist(actual, expected) {
    expected.forEach((field) => {
      // @ts-ignore
      expect(actual[field], `Field ${field} is not defined. Object is ${JSON.stringify(actual, null, 2)}`).toBeDefined();
    });
  }

  public static expectNotEmptyField(value: any): void {
    expect(_.isEmpty(value)).toBeFalsy();
  }

  public static expectNotEmptyEntityField(entity: any, field: any): void {
    this.expectNotEmptyField(entity[field]);
  }

  public static expectEmptyObject(value: any): void {
    expect(value).toBeDefined();
    expect(value).not.toBeNull();
    expect(typeof value).toBe('object');

    expect(value).toMatchObject({});
  }

  public static expectNotEmpty(actual: any): void {
    expect(_.isEmpty(actual)).toBeFalsy();
  }

  public static expectToBeObject(actual: any): void {
    expect(actual).toBeDefined();
    expect(actual).not.toBeNull();

    expect(typeof actual).toBe('object');
  }

  static expectValuesAreExpected(expected, actual, skipFields: string[] = []) {
    expect(_.isEmpty(actual)).toBeFalsy();
    for (const field in expected) {
      if (~skipFields.indexOf(field)) {
        continue;
      }

      if (expected.hasOwnProperty(field)) {
        // noinspection JSUnfilteredForInLoop
        // @ts-ignore
        expect(actual.hasOwnProperty(field), `There is no property in actual: ${field}`).toBeTruthy();
        // noinspection JSUnfilteredForInLoop
        // @ts-ignore
        expect(actual[field], `${field} does not match expected value`).toEqual(expected[field]);
      }
    }
  }

  /**
   *
   * @param {Object} res
   * @param {boolean} allowEmpty
   */
  static expectValidListResponse(res, allowEmpty = false) {
    this.expectStatusOk(res);

    this.expectValidListBody(res.body, allowEmpty);
  }

  /**
   *
   * @param {Object} body
   * @param {boolean} allowEmpty
   */
  static expectValidListBody(body, allowEmpty = false) {
    const { data, metadata } = body;
    expect(data).toBeTruthy();

    expect(Array.isArray(data)).toBeTruthy();

    if (!allowEmpty) {
      expect(data.length).toBeGreaterThan(0);
    }

    this.checkValidMetadataStructure(metadata);
  }

  public static checkEmptyResponseList(response: ListResponse): void {
    this.checkListResponseStructure(response);
    expect(response.data.length).toBe(0);
    this.checkEmptyListResponseMetadata(response);
  }

  public static checkEmptyDataMetadata(metadata: ListMetadata): void {
    expect(metadata.total_amount).toBe(0);
    expect(metadata.has_more).toBeFalsy();
    expect(typeof metadata.page).toBe('number');
    expect(typeof metadata.per_page).toBe('number');
  }

  public static checkValidMetadataStructure(metadata: ListMetadata): void {
    expect(metadata).toBeDefined();
    expect(metadata).not.toBeNull();
    expect(typeof metadata).toBe('object');

    expect(metadata.total_amount).toBeDefined();
    expect(typeof metadata.total_amount).toBe('number');

    expect(metadata.total_amount).toBeGreaterThanOrEqual(0);

    expect(metadata.page).toBeDefined();
    // expect(typeof metadata.page).toBe('number'); // #task

    expect(metadata.per_page).toBeDefined();
    // expect(metadata.per_page).toBeGreaterThan(0); // #task
    // expect(typeof metadata.per_page).toBe('number'); // #task

    expect(metadata.has_more).toBeDefined();
    expect(typeof metadata.has_more).toBe('boolean');
  }

  public static checkListResponseStructure(
    response: ListResponse,
  ): void {
    this.expectNotEmpty(response);

    expect(response.data).toBeDefined();
    expect(Array.isArray(response.data)).toBeTruthy();
    expect(response.metadata).toBeDefined();

    this.checkValidMetadataStructure(response.metadata);
  }

  public static checkMetadataByValues(response, page, perPage, totalAmount, hasMore) {
    const { metadata } = response;

    expect(metadata).toBeDefined();
    expect(metadata.has_more).toBe(hasMore);
    expect(metadata.page).toBe(page);
    expect(metadata.per_page).toBe(perPage);
    expect(metadata.total_amount).toBe(totalAmount);
  }

  public static checkEmptyListResponseMetadata(response: ListResponse): void {
    const { metadata } = response;
    this.checkValidMetadataStructure(metadata);
    this.checkEmptyDataMetadata(metadata);
  }
}

export = ResponseHelper;
