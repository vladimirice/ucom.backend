"use strict";
class CurrencyHelper {
    static convertToMajor(value, precision) {
        return value / (10 ** precision);
    }
    static convertToMinor(value, precision) {
        return value * (10 ** precision);
    }
}
module.exports = CurrencyHelper;
