import { injectable, multiInject } from 'inversify';
import 'reflect-metadata';
import { IProcessedTrace, ITrace } from '../interfaces/blockchain-traces-interfaces';
import { ITraceChainMetadata, TraceProcessor } from '../interfaces/traces-sync-interfaces';
import { BlockchainTracesDiTypes } from '../interfaces/di-interfaces';
import { AppError } from '../../api/errors';

@injectable()
class BlockchainTracesProcessorChain {
  private readonly manyProcessors: TraceProcessor[];

  public constructor(
    @multiInject(BlockchainTracesDiTypes.tracesProcessor) manyProcessors: TraceProcessor[],
  ) {
    this.manyProcessors = manyProcessors;
  }

  public processChain(trace: ITrace, metadata: ITraceChainMetadata): IProcessedTrace {
    for (const processor of this.manyProcessors) {
      const processedTrace = processor.processTrace(trace, metadata);

      if (processedTrace === null) {
        continue;
      }

      return processedTrace;
    }

    throw new AppError(`There is no processor for the trace, but must be. Trace is: ${JSON.stringify(trace)}`);
  }
}

export = BlockchainTracesProcessorChain;
