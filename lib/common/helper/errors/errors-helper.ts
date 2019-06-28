import { AppError } from '../../../api/errors';

class ErrorsHelper {
  public static throwUnsupportedParamAppError(param: string): void {
    throw new AppError(`Unsupported parameter: ${param}`);
  }
}

export = ErrorsHelper;
