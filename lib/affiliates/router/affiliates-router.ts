import AttributionService = require('../service/conversions/attribution-service');
import { formDataParser } from '../../api/middleware/form-data-parser-middleware';
import UnprocessableEntityError = require('../errors/unprocessable-entity-error');

const express = require('express');
const statuses = require('statuses');

require('express-async-errors');

const AffiliatesRouter = express.Router();

// POST in order to avoid any caching
AffiliatesRouter.post('/referral-programs', [formDataParser], async (req, res) => {
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

export = AffiliatesRouter;
