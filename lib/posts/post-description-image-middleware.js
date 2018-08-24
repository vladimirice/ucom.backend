const descriptionStoragePath = `${__dirname}/../../public/upload`;
const multer  = require('multer');
const path  = require('path');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, descriptionStoragePath)
  },

  filename: function (req, file, cb) {
    cb(null, 'post-' + file.fieldname + '-' + Date.now() + path.extname(file.originalname))
  }
});

const upload = multer({ storage: storage });
const descriptionParser = upload['fields']([{ name: 'image', maxCount: 1 }]);

module.exports = {
  descriptionParser,
  descriptionStoragePath
};