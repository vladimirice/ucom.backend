const multer  = require('multer');
const path  = require('path');

const orgImageStoragePath = `${__dirname}/../../../public/upload/organizations`;

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, orgImageStoragePath)
  },

  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname))
  }
});

const upload = multer({ storage: storage });
const cpUpload = upload['fields']([{ name: 'avatar_filename', maxCount: 1 }]);

module.exports = {
  cpUpload,
  orgImageStoragePath
};