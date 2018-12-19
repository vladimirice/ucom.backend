const express = require('express');
const TagsRouter  = express.Router();

const TagsFetchService = require('../../lib/tags/service/tags-fetch-service');

TagsRouter.get('/:tag_id', async (req, res) => {
  const response = await TagsFetchService.findAndProcessOneTagById(req.tag_id);

  res.send(response);
});

TagsRouter.param('tag_id', (req, res, next, incoming_id) => {
  const value = parseInt(incoming_id);

  if (!value) {
    throw new BadRequestError({
      'tag_id': 'Tag ID must be a valid integer'
    })
  }

  req.tag_id = value;

  next();

  // Check is tag exist and catch exceptions properly
  // TODO
});

module.exports = TagsRouter;