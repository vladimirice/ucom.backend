import { AppError } from '../../api/errors';

const readChunk = require('read-chunk');
const fileType = require('file-type');
const fs = require('fs');

class ImageTypeValidator {
  public static validateSize(filePath: string, allowedSizeInBytes: number): boolean {
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    const stats = fs.statSync(filePath);
    const sizeInBytes = stats.size;

    return sizeInBytes <= allowedSizeInBytes;
  }

  public static validateExtension(filePath: string, allowed: string[]): string | null {
    if (allowed.length === 0) {
      throw new AppError('It is not possible to use validator with empty allowed set');
    }

    if (!this.validateByRegex(filePath, allowed)) {
      return null;
    }

    const manyValidators = this.getValidatorSet();

    for (const type of allowed) {
      if (!manyValidators[type]) {
        throw new AppError(`Unsupported type: ${type}`);
      }

      if (manyValidators[type](filePath)) {
        return type;
      }
    }

    return null;
  }

  private static isJpg(filePath: string): boolean {
    const buffer = readChunk.sync(filePath, 0, 3);

    if (!buffer || buffer.length < 3) {
      return false;
    }

    return buffer[0] === 255 &&
      buffer[1] === 216 &&
      buffer[2] === 255;
  }

  private static isGif(filePath): boolean {
    const buffer = readChunk.sync(filePath, 0, 3);

    const match = fileType(buffer);

    if (!match) {
      return false;
    }

    return match.ext === 'gif';
  }

  private static getValidatorSet(): any {
    return {
      gif: this.isGif,
      jpg: this.isJpg,
    };
  }

  private static validateByRegex(filePath: string, allowed: string[]): boolean {
    // eslint-disable-next-line security/detect-non-literal-regexp
    const regex = new RegExp(`.(${allowed.join('|')})$`);

    return !!filePath.match(regex);
  }
}

export = ImageTypeValidator;
