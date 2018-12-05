const ImportanceEventService = require('../lib/eos/service/importance-event-service');

// In this case it is ok than during every deploy pm2 cron starts this process - not exactly every hour
(async () => {
  await ImportanceEventService.updateDeltaRateStats();
})();
