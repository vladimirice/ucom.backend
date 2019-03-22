import { BadRequestError } from '../../api/errors';

const express = require('express');

const { formDataParser } = require('../../api/middleware/form-data-parser-middleware');

import EnvHelper = require('../../common/helper/env-helper');
import GithubSampleValues = require('../../../test/helpers/github-sample-values');

const GithubAuthMockRouter = express.Router();

require('express-async-errors');

GithubAuthMockRouter.post('/login/oauth/access_token', [formDataParser], async (req, res) => {
  if (EnvHelper.isNotTestEnv()) {
    throw new BadRequestError('Not found', 404);
  }

  const { code } = req.body;
  if (!code) {
    throw new BadRequestError(`There is no code inside request. Body is: ${JSON.stringify(req.body)}`, 404);
  }

  const accessToken = GithubSampleValues.getAccessTokenForCode(code);

  res.send({
    access_token: accessToken,
    token_type: 'bearer',
    scope: '',
  });
});

GithubAuthMockRouter.get('/user', async (req, res) => {
  if (EnvHelper.isNotTestEnv()) {
    throw new BadRequestError('Not found', 404);
  }

  const accessToken = req.query.access_token;
  if (!accessToken) {
    throw new BadRequestError(
      `There is no access_token in query string. Query string is: ${JSON.stringify(req.query)}`,
    );
  }

  const result = GithubSampleValues.getSampleExternalData(accessToken);

  res.send(result);
});

export = GithubAuthMockRouter;
