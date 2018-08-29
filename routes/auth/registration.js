const express = require('express');
const router  = express.Router();
const EosAuth = require('../../lib/eos/eos-auth');

/* Check is account_name valid */
router.post('/validate-account-name', async function (req, res) {
  const account_name = req.body['account_name'];

  if (!account_name) {
    return res.status(400).send({
      'errors': {
        'account_name': 'Account name parameter is required'
      }
    });
  }

  // TODO - only for MVP in order to avoid questions
  const premiumAccounts = [
    'vlad', 'jane'
  ];

  if (premiumAccounts.indexOf(account_name) === -1
    && account_name.match(/^[a-z1-5]{12}$/) === null) {
    return res.status(400).send({
      'errors': {
        'account_name': 'Account name must contain only a-z or 1-5 and must have exactly 12 symbols length'
      }
    });
  }

  if (!await EosAuth.isAccountAvailable(account_name)) {
    return res.status(400).send({
      'errors': {
        'account_name': 'That account name is taken. Try another'
      }
    });
  }


  res.send({
    status: 'ok'
  })
});





module.exports = router;