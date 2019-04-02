class OneUserInputValidator {
  public static doesIdentityLooksLikeId(incomingValue: string): boolean {
    return !!(incomingValue[0] !== '0' && +incomingValue);
  }
}

export = OneUserInputValidator;
