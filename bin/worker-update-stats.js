const StatsRepo = require('../lib/entities/repository/entity-stats-current-repository');

StatsRepo.updateUpvoteDelta().then(() => {
  console.log('Job is finished');
});
