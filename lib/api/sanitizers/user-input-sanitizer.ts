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
        case 'boolean':
          sanitized = this.sanitizeBooleanValue(toSanitize);
          break;
        default:
          throw new AppError(`Unsupported sanitizationType: ${rules.request.sanitizationType}`);
      }

      body[fieldName] = sanitized;
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

  private static sanitizeBooleanValue(value: any): boolean {
    switch (typeof value) {
      case 'boolean':
        return value;
      case 'string':
        return value === 'false' ? false : !!value; // form-data might pass false as string
      case 'number':
      default:
        return !!value;
    }
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
      'src',
      'allowfullscreen',
      'allow',
      'href',
      'name',
      'target',
      'contenteditable',
      'data-poll',
    ];

    const tagsWithCommonAttributes: string[] = [
      'pre',
      'blockquote',
      'div',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',

      'p',
      'b',
      'strong',
      'em',
      'br',
      'i',
      'section',

      'article',
      'dl',
      'dt',
      'dd',
      'a',
      'ul',
      'ol',
      'li',
      'b',
      'i',
      'u',
      'span',
      'strike',

      'figure',
      'a',
    ];

    const set: any = {};
    for (const tag of tagsWithCommonAttributes) {
      set[tag] = commonAllowedAttributes;
    }

    set.iframe = Array.prototype.concat(commonAllowedAttributes, [
      'scrolling',
    ]);

    set.img = Array.prototype.concat(commonAllowedAttributes, [
      'alt',
    ]);

    return set;
  }
}

export = UserInputSanitizer;
