class EosBlockchainStatusDictionary {
  public static getStatusNew(): number {
    return 0; // #deprecated - do not use 0 in the future
  }

  public static getStatusIsSent(): number {
    return 1;
  }

  public static getNotRequiredToSend(): number {
    return 10;
  }
}

export = EosBlockchainStatusDictionary;
