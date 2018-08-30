const models = require('../../../models');


require('jest-expect-message');


class PostsHelper {

  static validateDbEntity(expected, actual) {
    const checkIsExistOnly = {
      'created_at': true,
      'updated_at': true,
    };

    for (const field in expected) {
      if (!expected.hasOwnProperty(field)) {
        continue;
      }

      if (checkIsExistOnly[field]) {
        expect(expected).toBeDefined();
        continue;
      }

      expect(actual[field], `${field} values are not equal`).toEqual(expected[field]);
    }
  }

  static validateResponseJson(actual, expected) {

    expect(actual.hasOwnProperty('title')).toBeTruthy();
    expect(actual.title).toBe(expected.title);

    expect(actual.hasOwnProperty('myselfData')).toBeTruthy();
    expect(actual.myselfData).toEqual(expected.myselfData);

    const onlyExistance = {
      'created_at': true,
      'updated_at': true,
    };

    for (const field in expected) {
      if (!expected.hasOwnProperty(field)) {
        continue;
      }

      if (onlyExistance[field]) {
        expect(actual[field], `Field ${field} is not defined`).toBeDefined();
        continue;
      }

      if (expected[field] === null || expected[field] === undefined) {
        continue;
      }

      expect(expected[field]).toEqual(actual[field]);
    }
  }
}

module.exports = PostsHelper;