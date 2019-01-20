"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const descriptionStoragePath = `${__dirname}/../../public/upload`;
exports.descriptionStoragePath = descriptionStoragePath;
const multer = require('multer');
const path = require('path');
const storage = multer.diskStorage({
    // @ts-ignore
    destination(req, file, cb) {
        cb(null, descriptionStoragePath);
    },
    // @ts-ignore
    filename(req, file, cb) {
        // tslint:disable-next-line:prefer-template
        cb(null, 'post-' + file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    },
});
const upload = multer({ storage });
const descriptionParser = upload['fields']([{ name: 'image', maxCount: 1 }]);
exports.descriptionParser = descriptionParser;
