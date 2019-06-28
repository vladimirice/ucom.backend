"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
const inversify_1 = require("inversify");
require("reflect-metadata");
const di_interfaces_1 = require("../interfaces/di-interfaces");
const errors_1 = require("../../api/errors");
let BlockchainTracesProcessorChain = class BlockchainTracesProcessorChain {
    constructor(manyProcessors) {
        this.manyProcessors = manyProcessors;
    }
    processChain(trace, metadata) {
        for (const processor of this.manyProcessors) {
            const processedTrace = processor.processTrace(trace, metadata);
            if (processedTrace === null) {
                continue;
            }
            return processedTrace;
        }
        throw new errors_1.AppError(`There is no processor for the trace, but must be. Trace is: ${JSON.stringify(trace)}`);
    }
};
BlockchainTracesProcessorChain = __decorate([
    inversify_1.injectable(),
    __param(0, inversify_1.multiInject(di_interfaces_1.BlockchainTracesDiTypes.tracesProcessor)),
    __metadata("design:paramtypes", [Array])
], BlockchainTracesProcessorChain);
module.exports = BlockchainTracesProcessorChain;
