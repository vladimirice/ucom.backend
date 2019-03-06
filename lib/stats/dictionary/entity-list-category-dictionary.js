"use strict";
const errors_1 = require("../../api/errors");
const TRENDING = 'trending';
const HOT = 'hot';
const FRESH = 'fresh';
const TOP = 'top';
const overviewTypeToStatsField = {
    [TRENDING]: 'importance_delta',
    [HOT]: 'activity_index_delta',
    [FRESH]: 'id',
    [TOP]: 'current_rate',
};
const overviewTypesWithStats = [
    TRENDING,
    HOT,
];
class EntityListCategoryDictionary {
    static isOverviewWithStats(overviewType) {
        return !!~overviewTypesWithStats.indexOf(overviewType);
    }
    static getStatsFieldByOverviewType(overviewType) {
        if (!overviewTypeToStatsField[overviewType]) {
            throw new errors_1.AppError(`Unsupported overview type: ${overviewType}`, 500);
        }
        return overviewTypeToStatsField[overviewType];
    }
    static getTrending() {
        return TRENDING;
    }
    static getHot() {
        return HOT;
    }
    static getFresh() {
        return FRESH;
    }
    static getTop() {
        return TOP;
    }
}
module.exports = EntityListCategoryDictionary;
