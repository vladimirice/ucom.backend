"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const UploaderImagesHelper = require("../helper/uploader-images-helper");
const appRootDir = require('app-root-path');
const config = require('config');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const uniqid = require('uniqid');
const storageDirPrefix = config.uploader.images.dir_prefix;
exports.storageDirPrefix = storageDirPrefix;
const storageFullPath = `${appRootDir}${storageDirPrefix}`;
exports.storageFullPath = storageFullPath;
const storage = multer.diskStorage({
    destination(
    // @ts-ignore
    req, 
    // @ts-ignore
    file, cb) {
        const subDirectory = UploaderImagesHelper.getDateBasedSubDirectory();
        const dirWithSubDir = `${storageFullPath}${subDirectory}`;
        const options = {
            recursive: true,
            mode: 0o755,
        };
        // eslint-disable-next-line security/detect-non-literal-fs-filename
        fs.mkdirSync(dirWithSubDir, options);
        cb(null, dirWithSubDir);
    },
    filename(req, file, cb) {
        const prefix = req.current_user_id || 'uploader';
        const uniqueFileName = uniqid(`${prefix}-`);
        cb(null, `${uniqueFileName}${path.extname(file.originalname)}`);
    },
});
const imageFieldName = 'one_image';
exports.imageFieldName = imageFieldName;
const upload = multer({
    storage,
});
const imagesInputProcessor = upload.fields([{ name: imageFieldName, maxCount: 1 }]);
exports.imagesInputProcessor = imagesInputProcessor;
