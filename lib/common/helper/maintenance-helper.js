"use strict";
const errors_1 = require("../../api/errors");
const EnvHelper = require("./env-helper");
class MaintenanceHelper {
    static hideAirdropsOfferIfRequired(req, postId) {
        if (EnvHelper.isNotAProductionEnv()) {
            return;
        }
        if ((postId === 6137 || postId === 6530) && !req.headers.cookie.includes('test_airdrop=true')) {
            throw new errors_1.BadRequestError('Not found', 404);
        }
    }
}
module.exports = MaintenanceHelper;
