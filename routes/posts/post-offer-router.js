const express = require('express');
const router = express.Router();
const authTokenMiddleWare = require('../../lib/auth/auth-token-middleware');
const PostService = require('../../lib/posts/post-service');
const PostOfferService = require('../../lib/posts/post-offer/post-offer-service');
const { cpUpload } = require('../../lib/posts/post-edit-middleware');

/* create new offer */
router.post('/', [authTokenMiddleWare, cpUpload], async (req, res) => {

  const newPost = await PostOfferService.createNew(req);

  res.send({
    'post_id': newPost.id,
    'main_image_filename': newPost.main_image_filename,
  });
});

module.exports = router;
