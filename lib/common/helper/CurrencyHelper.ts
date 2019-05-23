class CurrencyHelper {
  public static convertToMajor(value: number, precision): number {
    return value / (10 ** precision);
  }
  public static convertToMinor(value: number, precision): number {
    return value * (10 ** precision);
  }

  public static convertToUosMinor(value): number {
    return this.convertToMinor(value, 4);
  }

  public static convertToUosMajor(value): number {
    return this.convertToMajor(value, 4);
  }
}

export = CurrencyHelper;
