"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const di_interfaces_1 = require("../interfaces/di-interfaces");
const TracesCommonFieldsValidator = require("../validator/traces-common-fields-validator");
const BlockchainTracesSyncService = require("../service/blockchain-traces-sync-service");
const BlockchainTracesProcessorChain = require("../service/blockchain-traces-processor-chain");
const UnknownTraceProcessor = require("../trace-processors/unknown-trace-processor");
const TransferUosTokensTraceProcessor = require("../trace-processors/transfer-uos-tokens-trace-processor");
function addTraceProcessors(diContainer) {
    diContainer.bind(di_interfaces_1.BlockchainTracesDiTypes.tracesProcessor).to(TransferUosTokensTraceProcessor);
    diContainer.bind(di_interfaces_1.BlockchainTracesDiTypes.tracesProcessor).to(UnknownTraceProcessor);
}
exports.initBlockchainTraces = (diContainer) => {
    diContainer.bind(di_interfaces_1.BlockchainTracesDiTypes.tracesCommonFieldsValidator).to(TracesCommonFieldsValidator);
    diContainer.bind(di_interfaces_1.BlockchainTracesDiTypes.blockchainTracesSyncService).to(BlockchainTracesSyncService);
    diContainer.bind(di_interfaces_1.BlockchainTracesDiTypes.blockchainTracesProcessorChain).to(BlockchainTracesProcessorChain);
    addTraceProcessors(diContainer);
};
