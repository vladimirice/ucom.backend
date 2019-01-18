const express = require('express');
const router = express.Router();

const orgRepository = require('../lib/organizations/repository').Main;

const orgModelProvider = require('../lib/organizations/service/organizations-model-provider');
const orgPostProcessor = require('../lib/organizations/service/organization-post-processor');

router.get('/search', async (req, res) => {
  const query = req.query.q;
  const models = await orgRepository.findByNameFields(query);

  models.forEach((model) => {
    model.entity_name = orgModelProvider.getEntityName();
    model.entity_id = model.id;

    orgPostProcessor.processOneOrg(model);

    delete model.id;
    delete model.followed_by;
  });

  res.send(models);
});

export = router;
