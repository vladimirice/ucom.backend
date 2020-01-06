# Blockchain explorer

![Blockchain explorer](https://raw.githubusercontent.com/UOSnetwork/ucom.backend/master/documentation/jpg/blockchain-explorer.jpg)

## Components
* There is a MongoDB database node to save raw blockchain transactions data.
* There are a lot of such database nodes coupled with blockchain nodes. Every node might fall in every moment. Thus, it is required to cache the data.
* Every minute a backend API explorer [worker](../../lib/blockchain-traces/workers/sync-irreversible-traces-worker.ts) tries to find new transactions.
* There is a set of rules how to determine transaction type. One processor for every type.
* Processors are determined by [Dependency Injection config](../../lib/blockchain-traces/inversify/blockchain-traces.inversify.config.ts)
* Every processor must extend the [Abstract processor class](../../lib/blockchain-traces/trace-processors/abstract-traces-processor.ts)
* All processors are listed [here](../../lib/blockchain-traces/trace-processors/processors)

## Workflow
* [Worker](../../lib/blockchain-traces/workers/sync-irreversible-traces-worker.ts) starts.
    * [Blockchain traces service](../../lib/blockchain-traces/service/blockchain-traces-sync-service.ts) is already correctly configured with the help of [Inversify library (dependency injection)](https://www.npmjs.com/package/inversify).
    * All existing processors form a chain
* [Blockchain traces service](../../lib/blockchain-traces/service/blockchain-traces-sync-service.ts) fetch a batch of transactions from MongoDB.
* [Blockchain traces chain](../../lib/blockchain-traces/service/blockchain-traces-processor-chain.ts) calls processors one by one with a single trace as an argument.
* If a processor does not know how to process the trace - it throws [enable to process error](../../lib/blockchain-traces/trace-processors/processor-errors.ts). Then, chain service calls the next processor.
* If a processor knows how to process the trace - it processes it and returns a data prepared to save to the database.
* The cycle is the same for every single transaction.

## How to explore transactions
* At the end, data prepared by processors is saved to the PostgreSQL database.
* [Blockchain fetch service](../../lib/eos/service/tr-traces-service/blockchain-tr-traces-fetch-service.ts) provides an API for the frontend applications to receive user's transactions history

## Where to find test framework components:
* [Autotests](../../test/integration/blockchain/blockchain-tr-traces.test.ts)
* [A generator of data for autotests](../../test/generators/blockchain/irreversible_traces/mongo-irreversible-traces-generator.ts)
* [Request helper](../../test/integration/blockchain/blockchain-tr-traces.test.ts)
* [Response checker](../../test/helpers/blockchain/irreversible-traces/irreversible-traces-checker.ts)

## How to add a new blockchain processor

* Create a new processor, [example](../../lib/blockchain-traces/trace-processors/processors/transfer-uos-tokens-trace-processor.ts)
* Add a processor to the [inversify container config](../../lib/blockchain-traces/inversify/blockchain-traces.inversify.config.ts)
* `UnknownTraceProcessor` must always be at the end of the list (if it is enabled)
* Keep in mind that a `chain of responsibility pattern` is implemented. A criterion for processing must be very strict.
