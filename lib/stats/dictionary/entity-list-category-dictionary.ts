const TRENDING    = 'trending';
const HOT         = 'hot';
const FRESH       = 'fresh';
const TOP         = 'top';

class EntityListCategoryDictionary {
  public static getTrending(): string {
    return TRENDING;
  }

  public static getHot(): string {
    return HOT;
  }

  public static getFresh(): string {
    return FRESH;
  }

  public static getTop(): string {
    return TOP;
  }
}

export = EntityListCategoryDictionary;
