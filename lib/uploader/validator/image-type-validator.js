"use strict";
const errors_1 = require("../../api/errors");
const readChunk = require('read-chunk');
const fileType = require('file-type');
const fs = require('fs');
class ImageTypeValidator {
    static validateSize(filePath, allowedSizeInBytes) {
        // eslint-disable-next-line security/detect-non-literal-fs-filename
        const stats = fs.statSync(filePath);
        const sizeInBytes = stats.size;
        return sizeInBytes <= allowedSizeInBytes;
    }
    static validateExtension(filePath, allowed) {
        if (allowed.length === 0) {
            throw new errors_1.AppError('It is not possible to use validator with empty allowed set');
        }
        if (!this.validateByRegex(filePath, allowed)) {
            return null;
        }
        const manyValidators = this.getValidatorSet();
        for (const type of allowed) {
            if (!manyValidators[type]) {
                throw new errors_1.AppError(`Unsupported type: ${type}`);
            }
            if (manyValidators[type](filePath)) {
                return type;
            }
        }
        return null;
    }
    static isJpg(filePath) {
        const buffer = readChunk.sync(filePath, 0, 3);
        if (!buffer || buffer.length < 3) {
            return false;
        }
        return buffer[0] === 255 &&
            buffer[1] === 216 &&
            buffer[2] === 255;
    }
    static isGif(filePath) {
        const buffer = readChunk.sync(filePath, 0, 3);
        const match = fileType(buffer);
        if (!match) {
            return false;
        }
        return match.ext === 'gif';
    }
    static getValidatorSet() {
        return {
            gif: this.isGif,
            jpg: this.isJpg,
        };
    }
    static validateByRegex(filePath, allowed) {
        // eslint-disable-next-line security/detect-non-literal-regexp
        const regex = new RegExp(`.(${allowed.join('|')})$`);
        return !!filePath.match(regex);
    }
}
module.exports = ImageTypeValidator;
