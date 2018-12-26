const processor = require('../lib/tags/service/tags-current-rate-processor');
const { WorkerLogger } = require('../config/winston');

processor.process()
  .then(() => {
    console.log('Job is finished');
  }).catch((err: Error) => {
    WorkerLogger.error(err);
    console.error('There is an error. See logs');
  });
