"use strict";
class CurrencyHelper {
    static convertToMajor(value, precision) {
        return value / (10 ** precision);
    }
    static convertToMinor(value, precision) {
        return value * (10 ** precision);
    }
    static convertToUosMinor(value) {
        return this.convertToMinor(value, 4);
    }
    static convertToUosMajor(value) {
        return this.convertToMajor(value, 4);
    }
}
module.exports = CurrencyHelper;
