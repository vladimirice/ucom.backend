const express = require('express');
const router  = express.Router();
const EosBlockchainUniqId = require('../../lib/eos/eos-blockchain-uniqid');
const { BadRequestError } = require('../../lib/api/errors');
const { formDataParser }  = require('../../lib/api/middleware/form-data-parser-middleware');

const BlockchainService = require('../../lib/eos/service').Blockchain;

router.get('/nodes', async (req, res) => {
  const service = getBlockchainService(req);

  const response = await service.getAndProcessNodes(req.query);

  res.send(response);
});

router.post('/content/uniqid', [ formDataParser ], async (req, res) => {
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
    'uniqid_signature': 'sample_signature',
  });
});

/**
 * @param {Object} req
 * @returns {BlockchainService}
 */
function getBlockchainService(req) {
  return req['container'].get('blockchain-service');
}

module.exports = router;