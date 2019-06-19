import { Container } from 'inversify';
import { BlockchainTracesDiTypes } from '../interfaces/di-interfaces';

import TracesCommonFieldsValidator = require('../validator/traces-common-fields-validator');
import BlockchainTracesSyncService = require('../service/blockchain-traces-sync-service');

export const initBlockchainTraces = (diContainer: Container) => {
  diContainer.bind(BlockchainTracesDiTypes.tracesCommonFieldsValidator).to(TracesCommonFieldsValidator);
  diContainer.bind(BlockchainTracesDiTypes.blockchainTracesSyncService).to(BlockchainTracesSyncService);
};
