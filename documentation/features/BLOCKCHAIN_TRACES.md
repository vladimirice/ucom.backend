# Blockchain traces

## How to add a new blockchain processor

* Create a new processor, [example](../../lib/blockchain-traces/trace-processors/transfer-uos-tokens-trace-processor.ts)
* Add a processor to the [inversify container config](../../lib/blockchain-traces/inversify/blockchain-traces.inversify.config.ts)
* `UnknownTraceProcessor` must always be at the end of the list.
* Keep in mind that a `chain of responsibility pattern` is implemented. A criterion for processing must be very strict.
