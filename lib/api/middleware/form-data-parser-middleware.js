"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const multer = require('multer');
const upload = multer();
const formDataParser = upload.array();
exports.formDataParser = formDataParser;
