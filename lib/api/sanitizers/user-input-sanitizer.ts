const sanitizeHtml = require('sanitize-html');
const _ = require('lodash');

class UserInputSanitizer {
  /**
   *
   * @param {Object} body - parameters to sanitize
   * @param {string[]} textOnlyFields - list of field names to strip all tags
   * @param {string[]} htmlFields - list of fields to strip all but allowed tags
   */
  static sanitizeRequestBody(body, textOnlyFields = [], htmlFields = []) {
    textOnlyFields.forEach((field) => {
      if (body[field]) {
        body[field] = sanitizeHtml(body[field], {
          allowedTags: [],
          allowedAttributes: [],
        });
      }
    });

    htmlFields.forEach((field) => {
      if (body[field]) {
        body[field] = sanitizeHtml(body[field], {
          allowedTags: Object.keys(this.getAllowedAttributes()),
          allowedAttributes: this.getAllowedAttributes(),
        });
      }
    });
  }

  /**
   *
   * @return {Object}
   * @private
   */
  private static getAllowedAttributes() {
    const commonAllowedAttributes = [
      'class',
      'style',
      'contenteditable',
    ];

    return {
      blockquote: commonAllowedAttributes,
      div: commonAllowedAttributes,
      h1: commonAllowedAttributes,
      h2: commonAllowedAttributes,
      h3: commonAllowedAttributes,

      p: commonAllowedAttributes,
      ul: commonAllowedAttributes,
      ol: commonAllowedAttributes,
      li: commonAllowedAttributes,
      b: commonAllowedAttributes,
      strong: commonAllowedAttributes,
      em: commonAllowedAttributes,
      br: commonAllowedAttributes,
      i: commonAllowedAttributes,
      strike: commonAllowedAttributes,

      figure: commonAllowedAttributes,
      iframe: _.concat(commonAllowedAttributes, ['src', 'allowfullscreen', 'scrolling']),
      img: _.concat(commonAllowedAttributes, ['src']),
      a: _.concat(commonAllowedAttributes, ['href']),
    };
  }
}

module.exports = UserInputSanitizer;
