const avatarStoragePath = `${__dirname}/../../public/upload`;
const multer  = require('multer');
const path  = require('path');

const storage = multer.diskStorage({
  // @ts-ignore
  destination(req, file, cb) {
    cb(null, avatarStoragePath);
  },

  // @ts-ignore
  filename(req, file, cb) {
    // tslint:disable-next-line:prefer-template
    cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
  },
});

const upload = multer({ storage });
const cpUpload = upload.fields([
  { name: 'avatar_filename', maxCount: 1 },
  { name: 'achievements_filename', maxCount: 1 },
]);

const parser = multer();
const bodyParser = parser.array();

export {
  cpUpload,
  avatarStoragePath,
  bodyParser,
};
