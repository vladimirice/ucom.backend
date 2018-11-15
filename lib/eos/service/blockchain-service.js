const { WalletApi }             = require('uos-app-wallet');
const { HttpForbiddenError }    = require('../../api/errors');
const BlockchainNodesRepository = require('../repository').Main;

class BlockchainService {
  /**
   *
   * @param {Object} currentUser
   */
  constructor(currentUser) {
    this.currentUser = currentUser;
  }

  static async updateBlockchainNodesByBlockchain() {
    const dataObjects = await WalletApi.getBlockchainNodes();

    // States
    /*
      * create new
      * update existing
      * mark as deleted
     */

    await BlockchainNodesRepository.createOrUpdateNodes(Object.values(dataObjects));
    await BlockchainNodesRepository.setDeletedAtNotExisted(Object.keys(dataObjects));

    // What about deleted

    // UPDATE tablename1 SET deleted_at = NOW() WHERE titleNOT IN


    // Next request will add another information

    /*

    how to update producers list?
    * fetch all from blockchain and process like for frontend
    * fetch all from database

    move through blockchain nodes by observing owner key
    * update node statistics - for existing ones
    * add new nodes for ones which does not exist already

    * check not existing ones somehow - mark as deleted_at and change title (unique key) - title_deleted_timestamp

    * set always page = 1 and per_page = total nodes amount in database
    */
  }

  /**
   * API method
   * @return {Object}
   */
  async getAndProcessNodes(query) {
    const currentAccountName = this.currentUser.isCurrentUser() ? this.currentUser.user.account_name : null;
    const myselfBpVoteOnly = !!query.myself_bp_vote;

    if (myselfBpVoteOnly && !currentAccountName) {
      throw new HttpForbiddenError('myself_bp_vote = true parameter is allowed for auth users only');
    }

    let voteInfo = {
      producers: [],
    };

    if (currentAccountName) {
      voteInfo = await WalletApi.getRawVoteInfo(currentAccountName);
    }

    // Replace this. Use backend database TODO
    const dataObjects = await BlockchainNodesRepository.findAllBlockchainNodes(true);

    let data = [];
    for (let m = 0; m < dataObjects.length; m++) {
      const model = dataObjects[m];

      if (currentAccountName) {
        model.myselfData = {
          bp_vote: false,
        };
      }

      voteInfo.producers.forEach(title => {
        if (model.title === title) {
          model.myselfData.bp_vote = true;
        }
      });

      data.push(model);
    }

    if (myselfBpVoteOnly) {
      const filteredData = [];

      for (let i = 0; i < data.length; i ++) {
        const item = data[i];
        if (item.myselfData.bp_vote === true) {
          filteredData.push(item);
        }
      }

      data = filteredData;
    }

    const metadata = {
      total_amount: 100,
      page: 1,
      per_page: 10,
      has_more: true,
    };

    return {
      data,
      metadata
    };
  }
}

module.exports = BlockchainService;