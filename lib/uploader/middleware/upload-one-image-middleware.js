"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const errors_1 = require("../../api/errors");
const appRootDir = require('app-root-path');
const config = require('config');
const multer = require('multer');
const path = require('path');
const storageDirPrefix = config.uploader.images.dir_prefix;
exports.storageDirPrefix = storageDirPrefix;
const storageFullPath = `${appRootDir}${storageDirPrefix}`;
exports.storageFullPath = storageFullPath;
// @ts-ignore
const imageFilter = function (req, file, cb) {
    // accept image only
    if (!file.originalname.match(/\.(jpg|gif|png)$/)) {
        return cb(new errors_1.BadRequestError('Allowed file externsions are: jpg, gif'), false);
    }
    cb(null, true);
};
const storage = multer.diskStorage({
    // @ts-ignore
    destination(req, file, cb) {
        cb(null, storageFullPath); // TODO
    },
    // @ts-ignore
    filename(req, file, cb) {
        cb(null, `post-${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`); // TODO
    },
});
const imageFieldName = 'one_image';
exports.imageFieldName = imageFieldName;
const upload = multer({
    storage,
    fileFilter: imageFilter,
    limits: {
        fileSize: 1024 * 1024 * 0.00001,
    },
});
const imagesInputProcessor = upload.fields([{ name: imageFieldName, maxCount: 1 }]);
exports.imagesInputProcessor = imagesInputProcessor;
