class ErrorEventToLogDto {
  public parentError;

  public message;

  public extraJson;

  constructor(message, extraJson, parentError) {
    this.message = message;
    this.extraJson = extraJson;

    this.parentError = parentError;
  }
}

export = ErrorEventToLogDto;
