class TransactionsPushResponseChecker {
  static checkOneTransaction(trxResponse, expected): void {
    expect(typeof trxResponse.transaction_id).toBe('string');
    expect(trxResponse.processed).toMatchObject(expected);
  }
}

export = TransactionsPushResponseChecker;
