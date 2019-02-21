"use strict";
const TRENDING = 'trending';
const HOT = 'hot';
const FRESH = 'fresh';
const TOP = 'top';
class EntityListCategoryDictionary {
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
