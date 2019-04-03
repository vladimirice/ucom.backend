const express = require('express');

const UploaderImagesRouter = express.Router();

// @ts-ignore
const config = require('config');

// @ts-ignore
const {
  imagesInputProcessor,
  imageFieldName,
  storageDirPrefix,
} = require('../middleware/upload-one-image-middleware');

const authTokenMiddleWare = require('../../auth/auth-token-middleware');
// @ts-ignore
const activityApiMiddleware   =
  require('../../activity/middleware/activity-api-middleware');

const middlewareSet = [
  authTokenMiddleWare,
  imagesInputProcessor,
  activityApiMiddleware.redlockBeforeActivity,
];

UploaderImagesRouter.post('/one-image', middlewareSet, async (req, res) => {
  const { filename } = req.files[imageFieldName][0];
  const rootUrl = config.get('host').root_url;

  const prefix = `${rootUrl}${storageDirPrefix}`;

  res.status(201).send({
    files: [
      {
        url: `${prefix}/${filename}`, // TODO
      },
    ],
  });
});

export = UploaderImagesRouter;
