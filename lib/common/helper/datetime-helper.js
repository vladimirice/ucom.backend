"use strict";
const moment = require('moment');
class DatetimeHelper {
    static currentDatetime() {
        return moment().utc().format();
    }
    static isNotStartedYet(startedAt) {
        return moment(startedAt) > moment();
    }
    static isInProcess(startedAt, finishedAt) {
        return moment() >= moment(startedAt) && moment() < moment(finishedAt);
    }
    static isFinished(finishedAt) {
        return moment() > moment(finishedAt);
    }
}
module.exports = DatetimeHelper;
