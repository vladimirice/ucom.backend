class NumbersHelper {
  public static generateRandomInteger(min: number, max: number): number {
    return this.generateRandomNumber(min, max, 0);
  }

  public static generateRandomNumber(min: number, max: number, precision: number): number {
    return +(Math.random() * (max - min) + min).toFixed(precision);
  }
}

export = NumbersHelper;
