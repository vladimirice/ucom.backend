import { AppError } from '../../api/errors';

class NumbersHelper {
  public static generateRandomInteger(min: number, max: number): number {
    return this.generateRandomNumber(min, max, 0);
  }

  public static generateRandomNumber(min: number, max: number, precision: number): number {
    return +(Math.random() * (max - min) + min).toFixed(precision);
  }

  public static processFieldToBeNumeric(
    value: string | number,
    fieldName: string,
    precision: number,
    disallowZero: boolean,
    disallowNegative: boolean,
  ): number {
    const processed = +(+value).toFixed(precision);
    if (!Number.isFinite(processed)) {
      throw new AppError(`Number is not finite. Field name is: ${fieldName}, basic value is: ${value}`);
    }

    if (disallowZero && processed === 0) {
      throw new AppError(`It is not allowed for ${fieldName} to be zero. Initial value is: ${value}`);
    }

    if (disallowNegative && processed < 0) {
      throw new AppError(`It is not allowed for ${fieldName} to be negative. Initial value is: ${value}`);
    }

    return processed;
  }
}

export = NumbersHelper;
