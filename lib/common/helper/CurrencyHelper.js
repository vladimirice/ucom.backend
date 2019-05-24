"use strict";
const d3 = require('d3-format');
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
    static getHumanReadableNumber(value) {
        return d3.format(",.10r")(value);
    }
}
module.exports = CurrencyHelper;
