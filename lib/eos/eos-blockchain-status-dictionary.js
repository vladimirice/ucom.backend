class EosBlockchainStatusDictionary {
  static getStatusIsSent() {
    return 1;
  }

  static getNotRequiredToSend() {
    return 10;
  }
  static getSendingErrorStatus() {
    return 11;
  }

}

module.exports = EosBlockchainStatusDictionary;