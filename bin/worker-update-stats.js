const moment = require('moment');
const StatsRepo = require('../lib/entities/repository/entity-stats-current-repository');

// Very strange pm2 CRON behaviour. After restarting (deployment) pm2 runs this job and ignoring
// ecosystem setting "only at 3 o'clock"
const now = moment();
if (now.hours() === 3) {
  StatsRepo.updateUpvoteDelta().then(() => {
    console.log('Job is finished');
  });
}
