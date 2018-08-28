const config = require('config');
const eosConfig = config.get('eosConfig');

const EosJs = require('eosjs');

const SMART_CONTRACT = 'uos.activity';
const CREATE_CONTENT_ACTION = 'makecontent';

class EosPosts {
  static createPost(senderData, contentId, contentTypeId) {
    const eos = EosJs({
      keyProvider: [
        senderData.activePk,
      ],
      httpEndpoint: eosConfig.httpEndpoint,
      verbose: true,
    });

    eos.transaction({
      actions: [{
        account: SMART_CONTRACT,
        name: CREATE_CONTENT_ACTION,
        authorization: [{
          actor: senderData.account_name,
          permission: 'active',
        }],
        data: {
          acc: senderData.account_name,
          content_id: contentId,
          content_type_id: contentTypeId,
          parent_content_id: ''
        },
      }],
    }).then((res) => {
      console.log(res);
    });
  }
}

module.exports = EosPosts;