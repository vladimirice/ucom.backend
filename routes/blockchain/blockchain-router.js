const express = require('express');
const router  = express.Router();
const EosBlockchainUniqId = require('../../lib/eos/eos-blockchain-uniqid');
const { BadRequestError } = require('../../lib/api/errors');
const multer = require('multer');
const upload = multer();

router.post('/content/uniqid', [ upload.array() ], async (req, res) => {
  const scope = req.body.scope;

  if (!scope) {
    throw new BadRequestError([
      {
        'field': 'scope',
        'message': 'scope must be defined'
      }
    ]);
  }

  const uniqid = EosBlockchainUniqId.getUniqidByScope(scope);

  res.status(201).send({
    'uniqid': uniqid,
    'uniqid_signature': 'ydsprew4324i' // TODO provide signature and validate it on backend
  });
});


module.exports = router;