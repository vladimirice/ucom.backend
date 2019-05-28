import BlockchainApiFetchService = require('../../lib/blockchain-nodes/service/blockchain-api-fetch-service');

const express = require('express');
require('express-async-errors');

const {  Dictionary } = require('ucom-libs-wallet');

const router  = express.Router();
const eosBlockchainUniqId = require('../../lib/eos/eos-blockchain-uniqid');
const { BadRequestError } = require('../../lib/api/errors');

const { formDataParser }  = require('../../lib/api/middleware/form-data-parser-middleware');

router.get('/nodes', async (req, res) => {
  // backward compatibility
  req.query.blockchain_nodes_type = Dictionary.BlockchainNodes.typeBlockProducer();

  const response = await BlockchainApiFetchService.getAndProcessNodes(req.query);

  res.send(response);
});

router.post('/content/uniqid', [formDataParser], async (req, res) => {
  const { scope } = req.body;

  if (!scope) {
    throw new BadRequestError([
      {
        field: 'scope',
        message: 'scope must be defined',
      },
    ]);
  }

  const uniqid = eosBlockchainUniqId.getUniqidByScope(scope);

  res.status(201).send({
    uniqid,
    uniqid_signature: 'sample_signature',
  });
});

export = router;
