import { AppError } from '../../api/errors';

const TRENDING    = 'trending';
const HOT         = 'hot';
const FRESH       = 'fresh';
const TOP         = 'top';

const overviewTypeToStatsField = {
  [TRENDING]: 'importance_delta',
  [HOT]:      'activity_index_delta',
  [FRESH]:    'id',
  [TOP]:      'current_rate',
};

const overviewTypesWithStats: string[] = [
  TRENDING,
  HOT,
];


class EntityListCategoryDictionary {
  public static isOverviewWithStats(overviewType: string): boolean {
    return !!~overviewTypesWithStats.indexOf(overviewType);
  }

  public static getStatsFieldByOverviewType(overviewType: string): string {
    if (!overviewTypeToStatsField[overviewType]) {
      throw new AppError(`Unsupported overview type: ${overviewType}`, 500);
    }

    return overviewTypeToStatsField[overviewType];
  }

  public static isTrending(overviewType: string | undefined): boolean {
    if (!overviewType) {
      return false;
    }

    return overviewType === this.getTrending();
  }

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
