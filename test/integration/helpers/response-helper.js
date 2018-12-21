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

  // noinspection JSUnusedGlobalSymbols
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
   * @param {Object} actual
   * @param {string[]} notExpected
   */
  static expectFieldsDoesNotExist(actual, notExpected) {
    const actualFields = Object.keys(actual);

    notExpected.forEach(field => {
      expect(actualFields[field]).not.toBeDefined();
    })
  }

  /**
   *
   * @param {Object} actual
   * @param {string[]} expected
   */
  static expectFieldsAreNotNull(actual, expected) {
    expected.forEach(field => {
      expect(actual[field], `Field ${field} is not defined. Object is ${JSON.stringify(actual, null, 2)}`).toBeDefined();
      expect(actual[field], `Field ${field} is null. Object is ${JSON.stringify(actual, null, 2)}`).not.toBeNull();
    })
  }

  /**
   *
   * @param {Object} actual
   * @param {string[]} expected
   */
  static expectFieldsAreExist(actual, expected) {
    expected.forEach(field => {
      expect(actual[field], `Field ${field} is not defined. Object is ${JSON.stringify(actual, null, 2)}`).toBeDefined();
    })
  }

  /**
   *
   * @param {Object} expected
   * @param {Object} actual
   */
  static expectValuesAreExpected(expected, actual) {
    expect(actual).toBeDefined();
    for (const field in expected) {
      // noinspection JSUnfilteredForInLoop
      expect(actual.hasOwnProperty(field), `There is no property in actual: ${field}`).toBeTruthy();
      // noinspection JSUnfilteredForInLoop
      expect(actual[field], `${field} does not match expected value`).toEqual(expected[field]);
    }
  }

  /**
   *
   * @param {Object} res
   * @param {boolean} allowEmpty
   */
  static expectValidListResponse(res, allowEmpty = false) {
    this.expectStatusOk(res);

    const data      = res.body.data;
    const metadata  = res.body.metadata;

    expect(data).toBeDefined();
    expect(data).not.toBeNull();
    expect(Array.isArray(data)).toBeTruthy();

    if (!allowEmpty) {
      expect(data.length).toBeGreaterThan(0);
    }

    this.expectValidMetadataStructure(metadata, allowEmpty);
  }

  /**
   *
   * @param {Object} metadata
   * @param {boolean} allowEmpty
   */
  static expectValidMetadataStructure(metadata, allowEmpty = false) {
    expect(metadata).toBeDefined();
    expect(metadata).not.toBeNull();
    expect(typeof metadata).toBe('object');

    expect(metadata.total_amount).toBeDefined();
    expect(typeof metadata.total_amount).toBe('number');

    if (allowEmpty) {
      expect(metadata.total_amount).toBeGreaterThanOrEqual(0);
    } else {
      expect(metadata.total_amount).toBeGreaterThan(0);
    }

    expect(metadata.page).toBeDefined();
    // expect(typeof metadata.page).toBe('number'); // TODO

    expect(metadata.per_page).toBeDefined();
    // expect(metadata.per_page).toBeGreaterThan(0); // TODO
    // expect(typeof metadata.per_page).toBe('number'); // TODO

    expect(metadata.has_more).toBeDefined();
    expect(typeof metadata.has_more).toBe('boolean');
  }

  static checkMetadata(response, page, perPage, totalAmount, hasMore) {
    const metadata = response.metadata;

    expect(metadata).toBeDefined();
    expect(metadata.has_more).toBe(hasMore);
    expect(metadata.page).toBe(page);
    expect(metadata.per_page).toBe(perPage);
    expect(metadata.total_amount).toBe(totalAmount);
  }
}

module.exports = ResponseHelper;