const express = require('express');
const router = express.Router();
const _ = require('lodash');

const OrgRepository       = require('../lib/organizations/repository').Main;
const UsersRepository     = require('../lib/users/repository').Main;
const OrgModelProvider    = require('../lib/organizations/service/organizations-model-provider');
const UsersModelProvider  = require('../lib/users/users-model-provider');

router.get('/search', async function(req, res) {
  const query = req.query.q;
  const orgs = await OrgRepository.findByNameFields(query);
  const users = await UsersRepository.findByNameFields(query);

  orgs.forEach(model => {
    model.entity_name = OrgModelProvider.getEntityName();
  });

  users.forEach(model => {
    model.entity_name = UsersModelProvider.getEntityName();

    model.title = `${model.first_name} ${model.last_name}`;

    delete model.first_name;
    delete model.last_name;

    // TODO - remove from search result
    delete model.account_name;
    delete model.current_rate;
  });

  res.send(_.concat(orgs, users));
});


module.exports = router;