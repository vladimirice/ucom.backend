const request = require('supertest');
const server = require('../../../app');

const RequestHelper = require('./request-helper');
const models = require('../../../models');

class CommentsHelper {
  /**
   *
   * @param {Object} actual
   */
  static checkCommentResponseBody(actual) {
    models['comments'].apiResponseFields().forEach(field => {
      expect(actual[field]).toBeDefined();
    });
  }
}

module.exports = CommentsHelper;