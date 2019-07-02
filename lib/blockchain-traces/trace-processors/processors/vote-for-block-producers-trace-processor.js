"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
/* eslint-disable class-methods-use-this */
const inversify_1 = require("inversify");
require("reflect-metadata");
const AbstractTracesProcessor = require("./../abstract-traces-processor");
const joi = require('joi');
const { BlockchainTrTraces } = require('ucom-libs-wallet').Dictionary;
let VoteForBlockProducersTraceProcessor = class VoteForBlockProducersTraceProcessor extends AbstractTracesProcessor {
    constructor() {
        super(...arguments);
        this.traceType = BlockchainTrTraces.getTypeVoteForBp();
        this.expectedActionsData = {
            voteproducer: {
                validationSchema: {
                    voter: joi.string().required().min(1).max(12),
                    proxy: joi.string().empty(''),
                    producers: joi.array().items(joi.string()),
                },
                minNumberOfActions: 1,
                maxNumberOfActions: 1,
            },
        };
    }
    getFromToAndMemo(actNameToActionDataArray) {
        const actionData = actNameToActionDataArray.voteproducer[0];
        return {
            from: actionData.act_data.voter,
            to: null,
            memo: '',
        };
    }
    getTraceThumbnail(actNameToActionDataArray) {
        const actionData = actNameToActionDataArray.voteproducer[0];
        return {
            producers: actionData.act_data.producers,
        };
    }
};
VoteForBlockProducersTraceProcessor = __decorate([
    inversify_1.injectable()
], VoteForBlockProducersTraceProcessor);
module.exports = VoteForBlockProducersTraceProcessor;
