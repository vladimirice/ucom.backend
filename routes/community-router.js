const express = require('express');
const router = express.Router();

router.get('/search', async function(req, res) {
  res.send({
    status: 'ok'
  });
});


module.exports = router;