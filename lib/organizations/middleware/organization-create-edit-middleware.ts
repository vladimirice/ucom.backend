/* tslint:disable:no-trailing-whitespace max-line-length */
const multer  = require('multer');
const path  = require('path');

const orgImageStoragePath = `${__dirname}/../../../public/upload/organizations`;

const storage = multer.diskStorage({
  // @ts-ignore
  destination (req, file, cb) {
    cb(null, orgImageStoragePath);
  },

  // @ts-ignore
  filename (req, file, cb) {
    let filenamePrefix;
    if (file.fieldname.includes('community_sources[') || file.fieldname.includes('partnership_sources[')) {

      filenamePrefix = file.fieldname.replace('][', '-');
      filenamePrefix = filenamePrefix.replace(/[\[\]]/g, '-');
    } else {
      filenamePrefix = `${file.fieldname}-`;
    }

    cb(null, filenamePrefix + Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });
const cpUpload = upload.any();
const cpUploadArray = upload.array();

export = {
  cpUpload,
  orgImageStoragePath,
  cpUploadArray,
};
