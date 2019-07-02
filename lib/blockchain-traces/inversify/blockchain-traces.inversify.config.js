"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const di_interfaces_1 = require("../interfaces/di-interfaces");
const TracesCommonFieldsValidator = require("../validator/traces-common-fields-validator");
const BlockchainTracesSyncService = require("../service/blockchain-traces-sync-service");
const BlockchainTracesProcessorChain = require("../service/blockchain-traces-processor-chain");
const UnknownTraceProcessor = require("../trace-processors/processors/unknown-trace-processor");
const TransferUosTokensTraceProcessor = require("../trace-processors/processors/transfer-uos-tokens-trace-processor");
const VoteForBlockProducersTraceProcessor = require("../trace-processors/processors/vote-for-block-producers-trace-processor");
const VoteForCalculatorsTraceProcessor = require("../trace-processors/processors/vote-for-calculators-trace-processor");
const ClaimEmissionTraceProcessor = require("../trace-processors/processors/claim-emission-trace-processor");
const StakeResourcesOnlyProcessor = require("../trace-processors/processors/stake-resources-only-processor");
const UnstakeResourcesOnlyProcessor = require("../trace-processors/processors/unstake-resources-only-processor");
const StakeUnstakeResourcesProcessor = require("../trace-processors/processors/stake-unstake-resources-processor");
const BuyRamProcessor = require("../trace-processors/processors/buy-ram-processor");
const SellRamProcessor = require("../trace-processors/processors/sell-ram-processor");
function addTraceProcessors(diContainer) {
    diContainer.bind(di_interfaces_1.BlockchainTracesDiTypes.tracesProcessor).to(TransferUosTokensTraceProcessor);
    diContainer.bind(di_interfaces_1.BlockchainTracesDiTypes.tracesProcessor).to(VoteForBlockProducersTraceProcessor);
    diContainer.bind(di_interfaces_1.BlockchainTracesDiTypes.tracesProcessor).to(VoteForCalculatorsTraceProcessor);
    diContainer.bind(di_interfaces_1.BlockchainTracesDiTypes.tracesProcessor).to(ClaimEmissionTraceProcessor);
    diContainer.bind(di_interfaces_1.BlockchainTracesDiTypes.tracesProcessor).to(StakeResourcesOnlyProcessor);
    diContainer.bind(di_interfaces_1.BlockchainTracesDiTypes.tracesProcessor).to(UnstakeResourcesOnlyProcessor);
    diContainer.bind(di_interfaces_1.BlockchainTracesDiTypes.tracesProcessor).to(StakeUnstakeResourcesProcessor);
    diContainer.bind(di_interfaces_1.BlockchainTracesDiTypes.tracesProcessor).to(BuyRamProcessor);
    diContainer.bind(di_interfaces_1.BlockchainTracesDiTypes.tracesProcessor).to(SellRamProcessor);
    // Next line must always be the last line
    diContainer.bind(di_interfaces_1.BlockchainTracesDiTypes.tracesProcessor).to(UnknownTraceProcessor);
}
exports.initBlockchainTraces = (diContainer) => {
    diContainer.bind(di_interfaces_1.BlockchainTracesDiTypes.tracesCommonFieldsValidator).to(TracesCommonFieldsValidator);
    diContainer.bind(di_interfaces_1.BlockchainTracesDiTypes.blockchainTracesSyncService).to(BlockchainTracesSyncService);
    diContainer.bind(di_interfaces_1.BlockchainTracesDiTypes.blockchainTracesProcessorChain).to(BlockchainTracesProcessorChain);
    addTraceProcessors(diContainer);
};
