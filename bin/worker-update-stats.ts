export {};

const importanceEventService = require('../lib/eos/service/importance-event-service');

(async () => {
  await importanceEventService.updateDeltaRateStats();
})();
