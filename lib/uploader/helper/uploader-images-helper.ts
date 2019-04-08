import moment = require('moment');

class UploaderImagesHelper {
  public static getDateBasedSubDirectory(): string {
    const now = moment().utc();

    return `/${now.year()}/${now.month() + 1}/${now.day()}`;
  }

  public static getRelativeFilenameForUrl(filePath: string): string {
    return `/${filePath.split('/').slice(-4).join('/')}`;
  }
}

export = UploaderImagesHelper;
