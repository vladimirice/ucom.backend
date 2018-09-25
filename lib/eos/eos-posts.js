const config = require('config');
const eosConfig = config.get('eosConfig');

const EosJs = require('eosjs');

const SMART_CONTRACT = 'uos.activity';
const CREATE_CONTENT_ACTION = 'makecontent';

/**
 * @deprecated
 * @see ContentTypeDictionary
 */
const CONTENT_TYPE_COMMENT = 3;

class EosPosts {
  /**
   *
   * @param {Object} senderData
   * @param {string} contentId - ID for blockchain
   * @param {string} parentId - ID for blockchain
   */
  static createComment(senderData, contentId, parentId) {
    const eos = EosJs({
      keyProvider: [
        senderData.activePk,
      ],
      httpEndpoint: eosConfig.httpEndpoint,
      verbose: true,
    });

    // noinspection JSUnresolvedFunction
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
          content_type_id: CONTENT_TYPE_COMMENT,
          parent_content_id: parentId,
        },
      }],
    }).then((res) => {
      console.log(res);
    });
  }

  static createPost(senderData, contentId, contentTypeId) {
    const eos = EosJs({
      keyProvider: [
        senderData.activePk,
      ],
      httpEndpoint: eosConfig.httpEndpoint,
      verbose: true,
    });

    // noinspection JSUnresolvedFunction
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