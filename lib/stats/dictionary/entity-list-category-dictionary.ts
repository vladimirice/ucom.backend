const TRENDING  = 'trending';
const HOT       = 'hot';

class EntityListCategoryDictionary {
  public static getTrending(): string {
    return TRENDING;
  }

  public static getHot(): string {
    return HOT;
  }
}

export = EntityListCategoryDictionary;