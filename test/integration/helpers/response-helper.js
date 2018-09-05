require('jest-expect-message');

class ResponseHelper {
  static expectStatusOk(res) {
    expect(res.status).toBe(200);
  }
  static expectStatusCreated(res) {
    expect(res.status).toBe(201);
  }

  static expectStatusNotFound(res) {
    expect(res.status).toBe(404);
  }

  static expectStatusBadRequest(res) {
    expect(res.status).toBe(400);
  }

  static expectStatusUnauthorized(res) {
    expect(res.status).toBe(401);
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

  static expectValuesAreExpected(expected, actual) {
    for (const field in expected) {
      expect(actual.hasOwnProperty(field), `There is no property in actual: ${field}`).toBeTruthy();
      expect(actual[field], `${field} does not match expected value`).toEqual(expected[field]);
    }
  }
}

module.exports = ResponseHelper;