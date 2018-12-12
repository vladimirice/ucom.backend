const express               = require('express');

const StaticRendererService = require('./service/static-renderer-service');

const app = express();

app.use(express.json());

app.get('*', async (req, res) => {
  const host = req.headers.host;
  const originalUrl = req.params[0];

  const html = await StaticRendererService.getHtml(host, originalUrl);

  return res.send(html);
});

module.exports = app;
