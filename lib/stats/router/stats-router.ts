import StatsFetchTotal = require('../service/fetch/StatsFetchTotal');

const express = require('express');

const StatsRouter = express.Router();

require('express-async-errors');

// @ts-ignore
StatsRouter.get('/total', async (req, res) => {
  const result = await StatsFetchTotal.fetchManyTotal();

  res.send(result);
});

export = StatsRouter;
