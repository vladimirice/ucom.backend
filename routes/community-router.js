const express = require('express');
const router = express.Router();

const OrgRepository = require('../lib/organizations/repository').Main;

router.get('/search', async function(req, res) {
  const query = req.query.q;
  const models = await OrgRepository.findByNameFields(query);

  res.send(models);
});


module.exports = router;