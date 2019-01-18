"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const importanceEventService = require('../lib/eos/service/importance-event-service');
(async () => {
    await importanceEventService.updateDeltaRateStats();
})();
