"use strict";
class AffiliatesAttributionIdsDictionary {
    static firstWins() {
        return 1;
    }
    static lastWins() {
        return 2;
    }
    static doesFirstWins(object) {
        return object.attribution_id === this.firstWins();
    }
    static isLastWins(object) {
        return object.attribution_id === this.lastWins();
    }
}
module.exports = AffiliatesAttributionIdsDictionary;
