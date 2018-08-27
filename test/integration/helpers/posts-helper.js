const models = require('../../../models');

class PostsHelper {
  static validateResponseJson(body, expectedPost) {

    expect(body.hasOwnProperty('title')).toBeTruthy();
    expect(body.title).toBe(expectedPost.title);


    const onlyExistance = {
      'created_at': true,
      'updated_at': true
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


      expect(expectedPost[field]).toBe(body[field]);
    }
  }
}

module.exports = PostsHelper;