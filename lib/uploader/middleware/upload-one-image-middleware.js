"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const appRootDir = require('app-root-path');
const config = require('config');
const multer = require('multer');
const path = require('path');
const storageDirPrefix = config.uploader.images.dir_prefix;
exports.storageDirPrefix = storageDirPrefix;
const storageFullPath = `${appRootDir}${storageDirPrefix}`;
exports.storageFullPath = storageFullPath;
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
const upload = multer({ storage });
const imagesInputProcessor = upload.fields([{ name: imageFieldName, maxCount: 1 }]);
exports.imagesInputProcessor = imagesInputProcessor;
