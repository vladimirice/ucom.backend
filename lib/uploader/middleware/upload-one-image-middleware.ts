import { BadRequestError } from '../../api/errors';

const appRootDir  = require('app-root-path');
const config      = require('config');
const multer      = require('multer');
const path        = require('path');

const storageDirPrefix  = config.uploader.images.dir_prefix;
const storageFullPath   = `${appRootDir}${storageDirPrefix}`;


// @ts-ignore
const imageFilter = function (req, file, cb) {
  // accept image only
  if (!file.originalname.match(/\.(jpg|gif|png)$/)) {
    return cb(new BadRequestError('Allowed file externsions are: jpg, gif'), false);
  }
  cb(null, true);
};

const storage = multer.diskStorage({
// @ts-ignore
  destination(req, file, cb) {
    cb(null, storageFullPath); // TODO
  },

  // @ts-ignore
  filename(req, file, cb) {
    cb(null, `post-${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`); // TODO
  },
});

const imageFieldName = 'one_image';
const upload = multer({
  storage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 1024 * 1024 * 0.00001,
  },
});

const imagesInputProcessor = upload.fields([{ name: imageFieldName, maxCount: 1 }]);

export {
  imagesInputProcessor,
  imageFieldName,
  storageFullPath,
  storageDirPrefix,
};
