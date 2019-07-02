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
const symbols_dictionary_1 = require("../../../common/dictionary/symbols-dictionary");
const BalancesHelper = require("../../../common/helper/blockchain/balances-helper");
const AbstractTracesProcessor = require("./../abstract-traces-processor");
const TransferUosHelper = require("../helpers/transfer-uos-helper");
const { BlockchainTrTraces } = require('ucom-libs-wallet').Dictionary;
let TransferUosTokensTraceProcessor = class TransferUosTokensTraceProcessor extends AbstractTracesProcessor {
    constructor() {
        super(...arguments);
        this.traceType = BlockchainTrTraces.getTypeTransfer();
        this.expectedActionsData = {
            transfer: {
                validationSchema: TransferUosHelper.getValidationSchema(),
                minNumberOfActions: 1,
                maxNumberOfActions: 1,
            },
        };
    }
    getTraceThumbnail(actNameToActionDataArray) {
        const actionData = actNameToActionDataArray.transfer[0];
        return {
            tokens: {
                active: BalancesHelper.getTokensAmountFromString(actionData.act_data.quantity, symbols_dictionary_1.UOS),
                currency: symbols_dictionary_1.UOS,
            },
        };
    }
    getFromToAndMemo(actNameToActionDataArray) {
        const actionData = actNameToActionDataArray.transfer[0];
        return {
            from: actionData.act_data.from,
            memo: actionData.act_data.memo,
            to: actionData.act_data.to,
        };
    }
};
TransferUosTokensTraceProcessor = __decorate([
    inversify_1.injectable()
], TransferUosTokensTraceProcessor);
module.exports = TransferUosTokensTraceProcessor;
