"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
/* eslint-disable newline-per-chained-call */
const inversify_1 = require("inversify");
require("reflect-metadata");
const joi = require('joi');
let TracesCommonFieldsValidator = class TracesCommonFieldsValidator {
    constructor() {
        this.actionsSchema = {
            act_data: joi.object().required(),
            inline_traces: joi.array().required(),
            receipt: joi.object().required(),
            account_ram_deltas: joi.array().required(),
            act: joi.object().required(),
            trx_id: joi.string().required().min(1),
            producer_block_id: joi.string().required().min(1),
            block_num: joi.number().required().min(1),
            block_time: joi.string().required().min(1),
            console: joi.string().empty(''),
            context_free: joi.boolean().required(),
            elapsed: joi.number().required().min(1),
        };
        this.schema = {
            actions: joi.array().required().min(1).items(joi.object(this.actionsSchema)),
            _id: joi.object().required(),
            account: joi.string().required().min(1).max(12),
            blockid: joi.string().required().min(1),
            blocknum: joi.number().required().min(1),
            blocktime: joi.string().required().min(1),
            irreversible: joi.boolean().required().allow(true),
            trxid: joi.string().required().min(1),
        };
    }
    validateOneTrace(trace) {
        return joi.validate(trace, this.schema, {
            abortEarly: false,
            allowUnknown: true,
            stripUnknown: false,
        });
    }
};
TracesCommonFieldsValidator = __decorate([
    inversify_1.injectable()
], TracesCommonFieldsValidator);
module.exports = TracesCommonFieldsValidator;
