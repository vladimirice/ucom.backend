"use strict";
const errors_1 = require("../../api/errors");
class BatchProcessingHelper {
    static async processWithBatch(fetchFunction, breakingFunction, processingFunction, limit, basicOffset = 0, overflowLimit = 1000000) {
        let offset = basicOffset;
        let counter = 0;
        do {
            const response = await fetchFunction(offset, limit);
            if (breakingFunction(response)) {
                break;
            }
            await processingFunction(response);
            offset += limit;
            counter += 1;
            if (counter > overflowLimit) {
                throw new errors_1.AppError('Batch cycle limiter is triggered');
            }
            // eslint-disable-next-line no-constant-condition
        } while (true);
    }
}
module.exports = BatchProcessingHelper;
