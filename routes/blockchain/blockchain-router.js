const express = require('express');
const router  = express.Router();
const EosBlockchainUniqId = require('../../lib/eos/eos-blockchain-uniqid');
const { BadRequestError } = require('../../lib/api/errors');
const { formDataParser } = require('../../lib/api/middleware/form-data-parser-middleware');

router.get('/nodes', async (req, res) => {
  const data = [
    {
      id: 1,
      title: 'Walmart',
      votes_count: 500,
      votes_amount: 500,
      currency: 'UOS',
      url: 'https://walmart.com',
      bp_status: 1, // 1 - active, 2 - backup
      myselfData: {
        bp_vote: true, // or false
      }
    },
    {
      id: 2,
      title: 'Amazon',
      votes_count: 350,
      votes_amount: 412.003,
      currency: 'UOS',
      url: 'https://amazon.com',
      bp_status: 2, // 1 - active, 2 - backup
      myselfData: {
        bp_vote: true, // or false
      }
    },
    {
      id: 3,
      title: 'Google',
      votes_count: 280,
      votes_amount: 302.0001,
      currency: 'UOS',
      url: 'https://google.com',
      bp_status: 1, // 1 - active, 2 - backup
      myselfData: {
        bp_vote: false, // or false
      }
    },
  ];

  const metadata = {
    total_amount: 100,
    page: 1,
    per_page: 10,
    has_more: true,
  };

  const response = {
    data,
    metadata
  };

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
    'uniqid_signature': 'ydsprew4324i' // TODO provide signature and validate it on backend
  });
});


module.exports = router;