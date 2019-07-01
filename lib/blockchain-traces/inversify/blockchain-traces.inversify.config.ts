import { Container } from 'inversify';
import { BlockchainTracesDiTypes } from '../interfaces/di-interfaces';
import { TraceProcessor } from '../interfaces/traces-sync-interfaces';

import TracesCommonFieldsValidator = require('../validator/traces-common-fields-validator');
import BlockchainTracesSyncService = require('../service/blockchain-traces-sync-service');
import BlockchainTracesProcessorChain = require('../service/blockchain-traces-processor-chain');
import UnknownTraceProcessor = require('../trace-processors/processors/unknown-trace-processor');
import TransferUosTokensTraceProcessor = require('../trace-processors/processors/transfer-uos-tokens-trace-processor');
import VoteForBlockProducersTraceProcessor = require('../trace-processors/processors/vote-for-block-producers-trace-processor');
import VoteForCalculatorsTraceProcessor = require('../trace-processors/processors/vote-for-calculators-trace-processor');
import ClaimEmissionTraceProcessor = require('../trace-processors/processors/claim-emission-trace-processor');
import StakeResourcesOnlyProcessor = require('../trace-processors/processors/stake-resources-only-processor');
import UnstakeResourcesOnlyProcessor = require('../trace-processors/processors/unstake-resources-only-processor');
import StakeUnstakeResourcesProcessor = require('../trace-processors/processors/stake-unstake-resources-processor');

function addTraceProcessors(diContainer: Container) {
  diContainer.bind<TraceProcessor>(BlockchainTracesDiTypes.tracesProcessor).to(TransferUosTokensTraceProcessor);
  diContainer.bind<TraceProcessor>(BlockchainTracesDiTypes.tracesProcessor).to(VoteForBlockProducersTraceProcessor);
  diContainer.bind<TraceProcessor>(BlockchainTracesDiTypes.tracesProcessor).to(VoteForCalculatorsTraceProcessor);
  diContainer.bind<TraceProcessor>(BlockchainTracesDiTypes.tracesProcessor).to(ClaimEmissionTraceProcessor);
  diContainer.bind<TraceProcessor>(BlockchainTracesDiTypes.tracesProcessor).to(StakeResourcesOnlyProcessor);
  diContainer.bind<TraceProcessor>(BlockchainTracesDiTypes.tracesProcessor).to(UnstakeResourcesOnlyProcessor);
  diContainer.bind<TraceProcessor>(BlockchainTracesDiTypes.tracesProcessor).to(StakeUnstakeResourcesProcessor);

  // Next line must always be the last line
  diContainer.bind<TraceProcessor>(BlockchainTracesDiTypes.tracesProcessor).to(UnknownTraceProcessor);
}

export const initBlockchainTraces = (diContainer: Container) => {
  diContainer.bind(BlockchainTracesDiTypes.tracesCommonFieldsValidator).to(TracesCommonFieldsValidator);
  diContainer.bind(BlockchainTracesDiTypes.blockchainTracesSyncService).to(BlockchainTracesSyncService);
  diContainer.bind(BlockchainTracesDiTypes.blockchainTracesProcessorChain).to(BlockchainTracesProcessorChain);

  addTraceProcessors(diContainer);
};
