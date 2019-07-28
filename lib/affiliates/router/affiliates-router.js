"use strict";
const form_data_parser_middleware_1 = require("../../api/middleware/form-data-parser-middleware");
const di_interfaces_1 = require("../interfaces/di-interfaces");
const AttributionService = require("../service/conversions/attribution-service");
const UnprocessableEntityError = require("../errors/unprocessable-entity-error");
const ActivityApiMiddleware = require("../../activity/middleware/activity-api-middleware");
const DiServiceLocator = require("../../api/services/di-service-locator");
const express = require('express');
const statuses = require('statuses');
const authTokenMiddleWare = require('../../../lib/auth/auth-token-middleware');
require('express-async-errors');
const AffiliatesRouter = express.Router();
const middlewareSet = [
    authTokenMiddleWare,
    form_data_parser_middleware_1.formDataParser,
    ActivityApiMiddleware.redlockBeforeActivity,
];
// POST in order to avoid any caching
AffiliatesRouter.post('/actions', [form_data_parser_middleware_1.formDataParser], async (req, res) => {
    let responseStatus;
    let responseBody;
    try {
        ({ responseStatus, responseBody } = await AttributionService.process(req));
    }
    catch (error) {
        if (error instanceof UnprocessableEntityError) {
            responseStatus = statuses('Unprocessable Entity');
            responseBody = {};
        }
        else {
            throw error;
        }
    }
    res.status(responseStatus).send(responseBody);
});
AffiliatesRouter.post('/referral-transaction', middlewareSet, async (req, res) => {
    const currentUser = DiServiceLocator.getCurrentUserOrException(req);
    const service = req.container.get(di_interfaces_1.AffiliatesDiTypes.registrationConversionService);
    await service.processReferral(req, currentUser);
    res.status(statuses('Created')).send({
        success: true,
    });
});
module.exports = AffiliatesRouter;
