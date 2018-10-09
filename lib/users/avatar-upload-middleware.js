const avatarStoragePath = `${__dirname}/../../public/upload`;
const multer  = require('multer');
const path  = require('path');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, avatarStoragePath)
  },

  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname))
  }
});

const upload = multer({ storage: storage });
const cpUpload = upload.fields([
  { name: 'avatar_filename', maxCount: 1 },
  { name: 'achievements_filename', maxCount: 1 }
]);

const parser = multer();
const bodyParser = parser.array();

module.exports = {
  cpUpload,
  avatarStoragePath,
  bodyParser
};