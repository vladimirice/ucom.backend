import { AppError, BadRequestError } from '../../api/errors';

class NumbersHelper {
  public static generateRandomInteger(min: number, max: number): number {
    return this.generateRandomNumber(min, max, 0);
  }

  public static generateRandomNumber(min: number, max: number, precision: number): number {
    return +(Math.random() * (max - min) + min).toFixed(precision);
  }

  public static processFloatModelProperty(value: string| number, fieldName: string = 'not-set'): number {
    return this.processFieldToBeNumeric(value, fieldName, 10, false, false);
  }

  public static processFieldToBeNumeric(
    value: string | number,
    fieldName: string,
    precision: number = 0,
    disallowZero: boolean = true,
    disallowNegative: boolean = true,
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

  public static isNumberFinitePositiveIntegerOrBadRequestError(value: number) {
    if (Number.isFinite(value) && value > 0) {
      return;
    }

    throw new BadRequestError(`Provided value should be finite positive integer but value is: ${value}`);
  }
}

export = NumbersHelper;
