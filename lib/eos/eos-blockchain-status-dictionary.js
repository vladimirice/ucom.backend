"use strict";
class EosBlockchainStatusDictionary {
    static getStatusNew() {
        return 0; // #deprecated - do not use 0 in the future
    }
    static getStatusIsSent() {
        return 1;
    }
    static getNotRequiredToSend() {
        return 10;
    }
}
module.exports = EosBlockchainStatusDictionary;
