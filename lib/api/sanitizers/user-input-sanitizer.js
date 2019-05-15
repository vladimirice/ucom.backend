"use strict";
const errors_1 = require("../errors");
const sanitizeHtml = require('sanitize-html');
const unescape = require('unescape');
class UserInputSanitizer {
    static sanitizeInputWithModelProvider(body, fieldsSet) {
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
            let sanitized;
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
                    throw new errors_1.AppError(`Unsupported sanitizationType: ${rules.request.sanitizationType}`);
            }
            body[fieldName] = sanitized;
        }
    }
    static sanitizeNumberValue(value) {
        return +value;
    }
    static sanitizeTextValue(value, toUnescape) {
        const sanitized = sanitizeHtml(value, {
            allowedTags: [],
            allowedAttributes: [],
        });
        return toUnescape ? unescape(sanitized) : sanitized;
    }
    static sanitizeHtmlValue(value, toUnescape) {
        const sanitized = sanitizeHtml(value, {
            allowedTags: Object.keys(this.getAllowedAttributes()),
            allowedAttributes: this.getAllowedAttributes(),
        });
        return toUnescape ? unescape(sanitized) : sanitized;
    }
    static sanitizeBooleanValue(value) {
        return !!value;
    }
    /**
     *
     * @return {Object}
     * @private
     */
    static getAllowedAttributes() {
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
module.exports = UserInputSanitizer;
