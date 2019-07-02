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
var BlockchainTracesSyncService_1;
"use strict";
/* eslint-disable no-console */
const inversify_1 = require("inversify");
require("reflect-metadata");
const di_interfaces_1 = require("../interfaces/di-interfaces");
const winston_1 = require("../../../config/winston");
const MongoExternalModelProvider = require("../../eos/service/mongo-external-model-provider");
const IrreversibleTracesClient = require("../client/irreversible-traces-client");
const IrreversibleTracesRepository = require("../repository/irreversible-traces-repository");
const _ = require('lodash');
const ACTION_TRACES = MongoExternalModelProvider.actionTracesCollection();
const SERVICE_NAME = 'blockchain-traces-sync';
let BlockchainTracesSyncService = BlockchainTracesSyncService_1 = class BlockchainTracesSyncService {
    constructor(tracesCommonFieldsValidator, blockchainTracesProcessorChain) {
        this.tracesCommonFieldsValidator = tracesCommonFieldsValidator;
        this.blockchainTracesProcessorChain = blockchainTracesProcessorChain;
    }
    async process(singleBatchSize = 1000, onlyOneBatch = false, resync = false) {
        let blockNumberGreaterThan = null;
        if (!resync) {
            blockNumberGreaterThan = await IrreversibleTracesRepository.findLastBlockNumber();
        }
        let totalProcessedCounter = 0;
        let totalSkippedCounter = 0;
        do {
            const result = await this.processBatch(singleBatchSize, blockNumberGreaterThan);
            totalProcessedCounter += result.insertedCount;
            totalSkippedCounter += result.skippedCount;
            blockNumberGreaterThan = result.lastBlockNumber;
            if (onlyOneBatch) {
                break;
            }
            console.log(`Batch is done. Batch size is: ${singleBatchSize}. Current totalProcessedCounter: ${totalProcessedCounter}`);
        } while (blockNumberGreaterThan !== null);
        return {
            totalProcessedCounter,
            totalSkippedCounter,
        };
    }
    async processBatch(limit, blockNumberGreaterThan) {
        const manyTraces = await BlockchainTracesSyncService_1.fetchTracesFromMongoDb(limit, blockNumberGreaterThan);
        if (!manyTraces || manyTraces.length === 0) {
            return {
                lastBlockNumber: null,
                skippedCount: 0,
                insertedCount: 0,
            };
        }
        const manyProcessedTraces = [];
        for (const trace of manyTraces) {
            const processedTrace = this.processOneTrace(trace);
            if (processedTrace !== null) {
                manyProcessedTraces.push(processedTrace);
            }
        }
        console.log(`Last block number is: ${manyTraces[manyTraces.length - 1].blocknum}`);
        if (manyProcessedTraces.length === 0) {
            return {
                lastBlockNumber: manyTraces[manyTraces.length - 1].blocknum,
                skippedCount: manyTraces.length,
                insertedCount: 0,
            };
        }
        const preparedTransactions = manyProcessedTraces.map(item => item.tr_id);
        let insertedTransactions;
        try {
            insertedTransactions = await IrreversibleTracesRepository.insertManyTraces(manyProcessedTraces);
        }
        catch (error) {
            console.error('A fatal error is occurred. Lets dump the traces');
            console.dir(manyProcessedTraces);
            throw error;
        }
        const duplications = _.difference(preparedTransactions, insertedTransactions);
        if (duplications.length > 0) {
            winston_1.WorkerLogger.info('There are transactions that are not inserted - duplications', {
                service: SERVICE_NAME,
                transactions_ids: duplications,
            });
        }
        return {
            lastBlockNumber: manyTraces[manyTraces.length - 1].blocknum,
            skippedCount: duplications.length,
            insertedCount: insertedTransactions.length,
        };
    }
    processOneTrace(trace) {
        const { error } = this.tracesCommonFieldsValidator.validateOneTrace(trace);
        if (!error) {
            return this.blockchainTracesProcessorChain.processChain(trace);
        }
        return null;
    }
    static async fetchTracesFromMongoDb(limit, blockNumberGreaterThan = null) {
        const collection = await IrreversibleTracesClient.useCollection(ACTION_TRACES);
        const where = {
            $and: [
                { irreversible: true },
            ],
        };
        if (typeof blockNumberGreaterThan === 'number') {
            where.$and.push({
                blocknum: {
                    $gte: blockNumberGreaterThan,
                },
            });
        }
        return collection
            .find(where)
            .sort({ blocknum: 1 })
            .limit(limit)
            .toArray();
    }
};
BlockchainTracesSyncService = BlockchainTracesSyncService_1 = __decorate([
    inversify_1.injectable(),
    __param(0, inversify_1.inject(di_interfaces_1.BlockchainTracesDiTypes.tracesCommonFieldsValidator)),
    __param(1, inversify_1.inject(di_interfaces_1.BlockchainTracesDiTypes.blockchainTracesProcessorChain)),
    __metadata("design:paramtypes", [Object, Object])
], BlockchainTracesSyncService);
module.exports = BlockchainTracesSyncService;
