const INCOME    = 1;
const DEBT      = 2;
const RESERVED  = 3;
const WAITING   = 4;
const WALLET    = 5;

class AccountTypesDictionary {
  public static income(): number {
    return INCOME;
  }

  public static debt(): number {
    return DEBT;
  }

  public static reserved(): number {
    return RESERVED;
  }

  public static waiting(): number {
    return WAITING;
  }

  public static wallet(): number {
    return WALLET;
  }
}

export = AccountTypesDictionary;
