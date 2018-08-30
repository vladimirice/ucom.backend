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

  static validateResponseJson(body, expectedPost) {

    expect(body.hasOwnProperty('title')).toBeTruthy();
    expect(body.title).toBe(expectedPost.title);

    expect(body.hasOwnProperty('myselfData')).toBeTruthy();
    expect(body.myselfData).toEqual(expectedPost.myselfData);


    const onlyExistance = {
      'created_at': true,
      'updated_at': true,
      'User': true
    };

    for (const field in expectedPost) {
      if (!expectedPost.hasOwnProperty(field)) {
        continue;
      }

      if (onlyExistance[field]) {
        expect(body[field]).toBeDefined();
        continue;
      }

      if (expectedPost[field] === null || expectedPost[field] === undefined) {
        continue;
      }

      expect(expectedPost[field]).toEqual(body[field]);
    }
  }
}

module.exports = PostsHelper;