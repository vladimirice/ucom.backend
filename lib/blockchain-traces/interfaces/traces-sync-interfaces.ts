import { ITrace, IProcessedTrace } from './blockchain-traces-interfaces';

interface ITraceChainMetadata {
  isError: boolean;
}

interface TraceProcessor {
  processTrace(trace: ITrace, metadata: ITraceChainMetadata): IProcessedTrace | null;
}

export {
  ITraceChainMetadata,
  TraceProcessor,
};
