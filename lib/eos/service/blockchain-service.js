const { WalletApi } = require('uos-app-wallet');
const { HttpForbiddenError } = require('../../api/errors');

class BlockchainService {
  /**
   *
   * @param {Object} currentUser
   */
  constructor(currentUser) {
    this.currentUser = currentUser;
  }

  /**
   *
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

    const dataObjects = await WalletApi.getBlockchainNodes();

    let data = [];
    let   id = 1;
    for (const accountName in dataObjects) {
      const model = dataObjects[accountName];

      model.id = id; id++;

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