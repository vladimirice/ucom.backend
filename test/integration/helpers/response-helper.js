require('jest-expect-message');

class ResponseHelper {
  static expectStatusOk(res) {
    expect(res.status, `Body is: ${JSON.stringify(res.body, null, 2)}`).toBe(200);
  }
  static expectStatusCreated(res) {
    expect(res.status, `Body is: ${JSON.stringify(res.body, null, 2)}`).toBe(201);
  }

  static expectStatusNotFound(res) {
    expect(res.status, `Body is: ${JSON.stringify(res.body, null, 2)}`).toBe(404);
  }

  static expectStatusBadRequest(res) {
    expect(res.status, `Body is: ${JSON.stringify(res.body, null, 2)}`).toBe(400);
  }

  static expectStatusUnauthorized(res) {
    expect(res.status, `Body is: ${JSON.stringify(res.body, null, 2)}`).toBe(401);
  }

  static expectStatusForbidden(res) {
    expect(res.status, `Body is: ${JSON.stringify(res.body, null, 2)}`).toBe(403);
  }

  /**
   *
   * @param {Object} res
   * @param {number} status
   */
  static expectStatusToBe(res, status) {
    expect(res.status, `Body is: ${JSON.stringify(res.body, null, 2)}`).toBe(status);
  }

  /**
   *
   * @param {Object} res
   * @param {Object} invalidFields
   */
  static checkValidErrorResponse(res, invalidFields) {
    const errorsArray = res.body.errors;

    expect(errorsArray).toBeDefined();

    invalidFields.forEach(field => {
      const target = errorsArray.find(err => err.field === field);
      expect(target).toBeDefined();
      expect(target.message).toBeDefined();
      expect(target.message).toMatch(field);
    });

  }

  // noinspection JSUnusedGlobalSymbols
  static compareObjectArrays(expected, actual) {
    expect(actual.length).toBe(expected.length);

    expected.forEach(post => {
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
    actualArray.forEach(model => {
      this.expectAllFieldsExistence(model, expectedInEvery);
    })
  }

  /**
   *
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
   * @param {Object} expected
   * @param {Object} actual
   */
  static expectValuesAreExpected(expected, actual) {
    for (const field in expected) {
      // noinspection JSUnfilteredForInLoop
      expect(actual.hasOwnProperty(field), `There is no property in actual: ${field}`).toBeTruthy();
      // noinspection JSUnfilteredForInLoop
      expect(actual[field], `${field} does not match expected value`).toEqual(expected[field]);
    }
  }
}

module.exports = ResponseHelper;