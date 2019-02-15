"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const EntityCalculationService = require("../lib/stats/service/entity-calculation-service");
(async () => {
    await EntityCalculationService.updateEntitiesDeltas();
})();
