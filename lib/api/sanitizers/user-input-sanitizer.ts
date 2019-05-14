import { AppError } from '../errors';
import { IModelFieldsSet } from '../../common/interfaces/models-dto';

const sanitizeHtml = require('sanitize-html');
const unescape = require('unescape');

class UserInputSanitizer {
  public static sanitizeInputWithModelProvider(body: any, fieldsSet: IModelFieldsSet): void {
    for (const fieldName in fieldsSet) {
      if (!fieldsSet.hasOwnProperty(fieldName)) {
        continue;
      }

      if (!body[fieldName]) {
        continue;
      }

      const rules = fieldsSet[fieldName];
      if (!rules.request) {
        delete body[fieldName];

        continue;
      }

      const toSanitize = body[fieldName];
      let sanitized: any;
      switch (rules.request.sanitizationType) {
        case 'any':
          sanitized = toSanitize;
          break;
        case 'number':
          sanitized = this.sanitizeNumberValue(toSanitize);
          break;
        case 'text':
          sanitized = this.sanitizeTextValue(toSanitize, true);
          break;
        case 'html':
          sanitized = this.sanitizeHtmlValue(toSanitize, true);
          break;
        default:
          throw new AppError(`Unsupported sanitizationType: ${rules.request.sanitizationType}`);
      }

      body[fieldName] = sanitized;
    }
  }

  /**
   * @deprecated
   * @see sanitizeInputWithModelProvider
   * @param body
   * @param textOnlyFields
   * @param htmlFields
   */
  public static sanitizeInput(
    body: any,
    textOnlyFields: string[] = [],
    htmlFields: string[] = [],
  ): void {
    for (const field of textOnlyFields) {
      if (body[field]) {
        body[field] = this.sanitizeTextValue(body[field], true);
      }
    }

    for (const field of htmlFields) {
      if (body[field]) {
        body[field] = this.sanitizeHtmlValue(body[field], true);
      }
    }
  }

  private static sanitizeNumberValue(value: any): number {
    return +value;
  }

  private static sanitizeTextValue(value: string, toUnescape: boolean): string {
    const sanitized = sanitizeHtml(value, {
      allowedTags: [],
      allowedAttributes: [],
    });

    return toUnescape ? unescape(sanitized) : sanitized;
  }

  private static sanitizeHtmlValue(value: string, toUnescape: boolean): string {
    const sanitized = sanitizeHtml(value, {
      allowedTags: Object.keys(this.getAllowedAttributes()),
      allowedAttributes: this.getAllowedAttributes(),
    });

    return toUnescape ? unescape(sanitized) : sanitized;
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
      img: Array.prototype.concat(commonAllowedAttributes, ['src', 'alt']),
      a: Array.prototype.concat(commonAllowedAttributes, ['href']),
    };
  }
}

export = UserInputSanitizer;
