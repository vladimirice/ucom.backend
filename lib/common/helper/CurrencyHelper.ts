// eslint-disable-next-line unicorn/filename-case
const d3 = require('d3-format');

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

  public static getHumanReadableNumber(value: number): string {
    return d3.format(',.10r')(value);
  }
}

export = CurrencyHelper;
