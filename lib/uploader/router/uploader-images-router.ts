const express = require('express');

const UploaderImagesRouter = express.Router();
import UploaderImagesService = require('../service/uploader-images-service');

const {
  imagesInputProcessor,
} = require('../middleware/upload-one-image-middleware');

const authTokenMiddleWare = require('../../auth/auth-token-middleware');
const activityApiMiddleware   =
  require('../../activity/middleware/activity-api-middleware');

const middlewareSet = [
  authTokenMiddleWare,
  imagesInputProcessor,
  activityApiMiddleware.redlockBeforeActivity,
];

UploaderImagesRouter.post('/one-image', middlewareSet, async (req, res) => {
  const response = UploaderImagesService.processOneImage(req);

  res.status(201).send(response);
});

export = UploaderImagesRouter;
