import EntityCalculationService = require('../lib/stats/service/entity-calculation-service');

export {};

(async () => {
  await EntityCalculationService.updateEntitiesDeltas();
})();
