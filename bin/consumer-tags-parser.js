"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const consumer = require('../lib/tags/job/consumer-tags-parser');
(() => __awaiter(this, void 0, void 0, function* () {
    try {
        const res = yield consumer.consume();
        console.log(`Consumer tags parser is started. Response from start is ${JSON.stringify(res, null, 2)}`);
    }
    catch (e) {
        console.error(e);
        process.exit(1);
    }
}))();
