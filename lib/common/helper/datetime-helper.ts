const moment = require('moment');

class DatetimeHelper {
  public static currentDatetime(): string {
    return moment().utc().format();
  }
}

export = DatetimeHelper;
