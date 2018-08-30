const express = require('express');
const router = express.Router();

/* GET home page. */
router.get('/', async function(req, res) {
  // await getPromise();
  throw new Error('User not found');
});

module.exports = router;
