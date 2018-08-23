const postImageStoragePath = `${__dirname}/../../public/upload`;
const multer  = require('multer');
const path  = require('path');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, postImageStoragePath)
  },

  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname))
  }
});

const upload = multer({ storage: storage });
const cpUpload = upload.fields([{ name: 'main_image_filename', maxCount: 1 }]);

module.exports = {
  cpUpload,
  postImageStoragePath
};