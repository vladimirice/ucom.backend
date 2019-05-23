"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const AirdropUsersMigrateService = require("../service/maintenance/airdrop-users-migrate-service");
const CloseHandlersHelper = require("../../common/helper/close-handlers-helper");
const ROUND_ONE_ID = 1;
const ROUND_TWO_ID = 4;
(async () => {
    await AirdropUsersMigrateService.migrateFromFirstRoundToSecond(ROUND_ONE_ID, ROUND_TWO_ID);
    await CloseHandlersHelper.closeDbConnections();
    console.log('Script is executed');
})();
