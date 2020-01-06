const multer = require('multer');

const upload = multer();
const formDataParser = upload.array();

export {
  formDataParser,
};
