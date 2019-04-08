"use strict";
const moment = require("moment");
class UploaderImagesHelper {
    static getDateBasedSubDirectory() {
        const now = moment().utc();
        return `/${now.year()}/${now.month() + 1}/${now.day()}`;
    }
    static getRelativeFilenameForUrl(filePath) {
        return `/${filePath.split('/').slice(-4).join('/')}`;
    }
}
module.exports = UploaderImagesHelper;
