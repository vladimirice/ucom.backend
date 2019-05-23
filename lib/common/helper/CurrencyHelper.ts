class CurrencyHelper {
  public static convertToMajor(value: number, precision): number {
    return value / (10 ** precision);
  }
  public static convertToMinor(value: number, precision): number {
    return value * (10 ** precision);
  }
}

export = CurrencyHelper;
