"use strict";
const express = require('express');
const communityRouter = express.Router();
const orgRepository = require('../lib/organizations/repository').Main;
const orgModelProvider = require('../lib/organizations/service/organizations-model-provider');
const orgPostProcessor = require('../lib/organizations/service/organization-post-processor');
communityRouter.get('/search', async (req, res) => {
    const query = req.query.q;
    const models = await orgRepository.findByNameFields(query);
    models.forEach((model) => {
        // eslint-disable-next-line no-param-reassign
        model.entity_name = orgModelProvider.getEntityName();
        // eslint-disable-next-line no-param-reassign
        model.entity_id = model.id;
        orgPostProcessor.processOneOrg(model);
        // eslint-disable-next-line no-param-reassign
        delete model.id;
        // eslint-disable-next-line no-param-reassign
        delete model.followed_by;
    });
    res.send(models);
});
module.exports = communityRouter;
