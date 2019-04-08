"use strict";
const moment = require('moment');
class DatetimeHelper {
    static currentDatetime() {
        return moment().utc().format();
    }
}
module.exports = DatetimeHelper;
