const express = require('express');
const router = express.Router();

const OrgRepository = require('../lib/organizations/repository').Main;

const OrgModelProvider = require('../lib/organizations/service/organizations-model-provider');
const OrgPostProcessor = require('../lib/organizations/service/organization-post-processor');

router.get('/search', async function(req, res) {
  const query = req.query.q;
  const models = await OrgRepository.findByNameFields(query);

  models.forEach(model => {
    model.entity_name = OrgModelProvider.getEntityName();
    model.entity_id = model.id;

    OrgPostProcessor.processOneOrg(model);

    delete model.id;
    delete model.followed_by;
  });

  res.send(models);
});


module.exports = router;