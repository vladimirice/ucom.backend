import { AppError } from '../../../api/errors';

class DeleteAllInArrayValidator {
  public static isValueMeanDeleteAll(value: any): boolean {
    if (!Array.isArray(value)) {
      throw new AppError('This validator works only with array inputs');
    }

    if (value.length !== 1) {
      return false;
    }

    return value[0] === '';
  }
}

export = DeleteAllInArrayValidator;
