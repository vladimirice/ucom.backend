import { ApiLogger } from '../../../config/winston';

class ErrorEventToLogDto {
  public parentError;

  public message;

  public extraJson;

  public static createAndLogError(
    parentError,
    extraJson = {},
    message = 'an error is occurred',
  ): void {
    const obj = new ErrorEventToLogDto(message, extraJson, parentError);

    obj.logAsError();
  }

  constructor(message, extraJson, parentError) {
    this.message = message;
    this.extraJson = extraJson;

    this.parentError = parentError;
  }

  public logAsError() {
    ApiLogger.error(this.message, {
      parentError: this.parentError,
      ...this.extraJson
    });
  }
}

export = ErrorEventToLogDto;
