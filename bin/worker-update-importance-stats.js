const ImportanceEventService = require('../lib/eos/service/importance-event-service');

ImportanceEventService.updateDeltaRateStats().then(() => {
  console.log('Job is finished');
});
