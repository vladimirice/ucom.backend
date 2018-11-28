const moment = require('moment');
const StatsRepo = require('../lib/entities/repository/entity-stats-current-repository');
const { WorkerLogger } = require('../config/winston');

// Very strange pm2 CRON behaviour. After restarting (deployment) pm2 runs this job and ignoring
// ecosystem setting "only at 3 o'clock"
const now = moment();
if (now.hours() === 3) {

  StatsRepo.updateUpvoteDelta().then(() => {
    console.log('Job is finished');
  }).catch(err => {
    WorkerLogger.error(err);
    console.error('There is an error. See logs');
  });

}
