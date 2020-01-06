import { formDataParser } from '../../api/middleware/form-data-parser-middleware';
import { AffiliatesDiTypes } from '../interfaces/di-interfaces';
import { UserModel } from '../../users/interfaces/model-interfaces';

import AttributionService = require('../service/conversions/attribution-service');
import UnprocessableEntityError = require('../errors/unprocessable-entity-error');
import RegistrationConversionService = require('../service/conversions/registration-conversion-service');
import ActivityApiMiddleware = require('../../activity/middleware/activity-api-middleware');
import DiServiceLocator = require('../../api/services/di-service-locator');

const express = require('express');
const statuses = require('statuses');
const authTokenMiddleWare = require('../../../lib/auth/auth-token-middleware');

require('express-async-errors');

const AffiliatesRouter = express.Router();

const middlewareSet: any = [
  authTokenMiddleWare,
  formDataParser,
  ActivityApiMiddleware.redlockBeforeActivity,
];

// POST in order to avoid any caching
AffiliatesRouter.post('/actions', [formDataParser], async (req, res) => {
  let responseStatus;
  let responseBody;

  try {
    ({ responseStatus, responseBody } = await AttributionService.process(req));
  } catch (error) {
    if (error instanceof UnprocessableEntityError) {
      responseStatus = statuses('Unprocessable Entity');
      responseBody = {};
    } else {
      throw error;
    }
  }

  res.status(responseStatus).send(responseBody);
});

AffiliatesRouter.post('/referral-transaction', middlewareSet, async (req, res) => {
  const currentUser: UserModel = DiServiceLocator.getCurrentUserOrException(req);

  const service: RegistrationConversionService =
  req.container.get(AffiliatesDiTypes.registrationConversionService);

  await service.processReferral(req, currentUser);

  res.status(statuses('Created')).send({
    success: true,
  });
});

export = AffiliatesRouter;
