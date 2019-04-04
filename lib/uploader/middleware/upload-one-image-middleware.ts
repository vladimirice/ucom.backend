const appRootDir  = require('app-root-path');
const config      = require('config');
const multer      = require('multer');
const path        = require('path');

const storageDirPrefix  = config.uploader.images.dir_prefix;
const storageFullPath   = `${appRootDir}${storageDirPrefix}`;

const storage = multer.diskStorage({
// @ts-ignore
  destination(req, file, cb) {
    cb(null, storageFullPath); // TODO date-based destination
  },

  // @ts-ignore
  filename(req, file, cb) {
    cb(null, `post-${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`); // TODO date-based destination
  },
});

const imageFieldName = 'one_image';
const upload = multer({
  storage,
});

const imagesInputProcessor = upload.fields([{ name: imageFieldName, maxCount: 1 }]);

export {
  imagesInputProcessor,
  imageFieldName,
  storageFullPath,
  storageDirPrefix,
};
