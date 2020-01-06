"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const postImageStoragePath = `${__dirname}/../../public/upload`;
exports.postImageStoragePath = postImageStoragePath;
const multer = require('multer');
const path = require('path');
const storage = multer.diskStorage({
    // @ts-ignore
    destination(req, file, cb) {
        cb(null, postImageStoragePath);
    },
    // @ts-ignore
    filename(req, file, cb) {
        // tslint:disable-next-line:prefer-template
        cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
    },
});
const upload = multer({ storage });
const cpUpload = upload.fields([{ name: 'main_image_filename', maxCount: 1 }]);
exports.cpUpload = cpUpload;
