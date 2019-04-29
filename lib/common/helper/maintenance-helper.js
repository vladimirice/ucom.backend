"use strict";
const errors_1 = require("../../api/errors");
const EnvHelper = require("./env-helper");
class MaintenanceHelper {
    static hideAirdropsOfferIfRequired(req, postId) {
        if (EnvHelper.isNotAProductionEnv()) {
            return;
        }
        const postIdsToHide = [6137, 6530];
        if (!postIdsToHide.includes(postId)) {
            return;
        }
        if (!req.headers) {
            throw new errors_1.BadRequestError('Not found', 404);
        }
        if (!req.headers.cookie) {
            throw new errors_1.BadRequestError('Not found', 404);
        }
        if (!req.headers.cookie.includes('test_airdrop=true')) {
            throw new errors_1.BadRequestError('Not found', 404);
        }
    }
}
module.exports = MaintenanceHelper;
