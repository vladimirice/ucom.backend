const sanitizeHtml = require('sanitize-html');
const unescape = require('unescape');

class UserInputSanitizer {
  public static unescapeObjectValues(object: any, manyFields: string[]): void {
    for (const field of manyFields) {
      object[field] = unescape(object[field]);
    }
  }

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
      'data-poll',
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
      iframe: Array.prototype.concat(commonAllowedAttributes, ['src', 'allowfullscreen', 'scrolling']),
      img: Array.prototype.concat(commonAllowedAttributes, ['src']),
      a: Array.prototype.concat(commonAllowedAttributes, ['href']),
    };
  }
}

export = UserInputSanitizer;
