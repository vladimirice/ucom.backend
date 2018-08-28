const config = require('config');
const eosConfig = config.get('eosConfig');

const EosJs = require('eosjs');

const SMART_CONTRACT = 'uos.activity';
const CREATE_CONTENT_ACTION = 'makecontent';

class EosUsersActivity {
  static async sendContentUpvoting() {

  }
}

module.exports = EosUsersActivity;