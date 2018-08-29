class EosBlockchainStatusDictionary {
  static getStatusNew() {
    return 0;
  }

  static getStatusIsSent() {
    return 1;
  }

  static getNotRequiredToSend() {
    return 10;
  }

}

module.exports = EosBlockchainStatusDictionary;