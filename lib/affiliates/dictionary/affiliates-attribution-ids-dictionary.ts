class AffiliatesAttributionIdsDictionary {
  public static firstWins(): number {
    return 1;
  }

  public static lastWins(): number {
    return 2;
  }

  public static doesFirstWins(object: any): boolean {
    return object.attribution_id === this.firstWins();
  }

  public static isLastWins(object: any): boolean {
    return object.attribution_id === this.lastWins();
  }
}

export = AffiliatesAttributionIdsDictionary;
