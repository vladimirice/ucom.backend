import { Container } from 'inversify';
import { BlockchainTracesDiTypes } from '../interfaces/di-interfaces';
import { TraceProcessor } from '../interfaces/traces-sync-interfaces';

import TracesCommonFieldsValidator = require('../validator/traces-common-fields-validator');
import BlockchainTracesSyncService = require('../service/blockchain-traces-sync-service');
import BlockchainTracesProcessorChain = require('../service/blockchain-traces-processor-chain');
import UnknownTraceProcessor = require('../trace-processors/unknown-trace-processor');
import TransferTokensTraceProcessor = require('../trace-processors/transfer-tokens-trace-processor');

function addTraceProcessors(diContainer: Container) {
  diContainer.bind<TraceProcessor>(BlockchainTracesDiTypes.tracesProcessor).to(TransferTokensTraceProcessor);
  diContainer.bind<TraceProcessor>(BlockchainTracesDiTypes.tracesProcessor).to(UnknownTraceProcessor);
}

export const initBlockchainTraces = (diContainer: Container) => {
  diContainer.bind(BlockchainTracesDiTypes.tracesCommonFieldsValidator).to(TracesCommonFieldsValidator);
  diContainer.bind(BlockchainTracesDiTypes.blockchainTracesSyncService).to(BlockchainTracesSyncService);
  diContainer.bind(BlockchainTracesDiTypes.blockchainTracesProcessorChain).to(BlockchainTracesProcessorChain);

  addTraceProcessors(diContainer);
};
