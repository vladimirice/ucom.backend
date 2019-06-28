const moment = require('moment');

class DatetimeHelper {
  public static getMomentInUtcString(datetime): string {
    return datetime.utc().format();
  }

  public static currentDatetime(): string {
    return moment().utc().format();
  }

  public static isNotStartedYet(startedAt: Date): boolean {
    return moment(startedAt) > moment();
  }

  public static isInProcess(startedAt: Date, finishedAt: Date): boolean {
    return moment() >= moment(startedAt) && moment() < moment(finishedAt);
  }

  public static isFinished(finishedAt: Date): boolean {
    return moment() > moment(finishedAt);
  }
}

export = DatetimeHelper;
