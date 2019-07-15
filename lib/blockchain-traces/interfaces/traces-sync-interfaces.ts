import { ITrace, IProcessedTrace } from './blockchain-traces-interfaces';

interface TraceProcessor {
  processTrace(trace: ITrace): IProcessedTrace;
}

export {
  TraceProcessor,
};
