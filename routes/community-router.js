const express = require('express');
const router = express.Router();

const OrgRepository = require('../lib/organizations/repository').Main;

const OrgModelProvider = require('../lib/organizations/service/organizations-model-provider');

router.get('/search', async function(req, res) {
  const query = req.query.q;
  const models = await OrgRepository.findByNameFields(query);

  models.forEach(model => {
    model.entity_name = OrgModelProvider.getEntityName();
    model.entity_id = model.id;

    delete model.id;
  });

  res.send(models);
});


module.exports = router;