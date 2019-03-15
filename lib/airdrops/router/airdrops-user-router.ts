import { BadRequestError } from '../../api/errors';

const express = require('express');

const AirdropsUserRouter = express.Router();

require('express-async-errors');

// @ts-ignore
AirdropsUserRouter.get('/:airdrop_id/user', async (req, res) => {
  throw new BadRequestError('Please use graphql implementation', 400);
});

export = AirdropsUserRouter;
