"use strict";
const express = require('express');
const router = express.Router();
const _ = require('lodash');
const orgRepository = require('../lib/organizations/repository').Main;
const usersRepository = require('../lib/users/repository').Main;
const orgModelProvider = require('../lib/organizations/service/organizations-model-provider');
const usersModelProvider = require('../lib/users/users-model-provider');
const orgPostProcessor = require('../lib/organizations/service/organization-post-processor');
router.get('/search', async (req, res) => {
    const query = req.query.q;
    const orgs = await orgRepository.findByNameFields(query);
    const users = await usersRepository.findByNameFields(query);
    orgs.forEach((model) => {
        model.entity_name = orgModelProvider.getEntityName();
        model.entity_id = model.id;
        orgPostProcessor.processOneOrg(model);
        delete model.id;
        delete model.followed_by;
    });
    users.forEach((model) => {
        model.entity_name = usersModelProvider.getEntityName();
        model.entity_id = model.id;
        model.title = `${model.first_name} ${model.last_name}`;
        delete model.first_name;
        delete model.last_name;
        delete model.id;
        // #task - remove from search result
        delete model.account_name;
    });
    res.send(_.concat(orgs, users));
});
module.exports = router;
