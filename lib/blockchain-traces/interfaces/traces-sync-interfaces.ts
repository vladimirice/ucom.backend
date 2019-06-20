import { ITrace, IProcessedTrace } from './blockchain-traces-interfaces';

interface ITraceChainMetadata {
  isError: boolean;
}

interface TraceProcessor {
  processTrace(trace: ITrace, metadata: ITraceChainMetadata): IProcessedTrace;
}

export {
  ITraceChainMetadata,
  TraceProcessor,
};
