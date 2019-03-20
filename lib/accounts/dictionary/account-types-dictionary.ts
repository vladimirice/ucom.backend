const INCOME = 1;
const DEBT = 2;

class AccountTypesDictionary {
  public static income(): number {
    return INCOME;
  }

  public static debt(): number {
    return DEBT;
  }
}

export = AccountTypesDictionary;
