"use strict";
class NumbersHelper {
    static generateRandomInteger(min, max) {
        return this.generateRandomNumber(min, max, 0);
    }
    static generateRandomNumber(min, max, precision) {
        return +(Math.random() * (max - min) + min).toFixed(precision);
    }
}
module.exports = NumbersHelper;
