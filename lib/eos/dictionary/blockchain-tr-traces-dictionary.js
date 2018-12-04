const TR_TYPE_TRANSFER            = 12;

const TR_TYPE_STAKE_RESOURCES     = 20;
const TR_TYPE_STAKE_WITH_UNSTAKE  = 21;

const TR_TYPE_UNSTAKING_REQUEST   = 30;
const TR_TYPE_VOTE_FOR_BP         = 40;

const TR_TYPE_BUY_RAM             = 60;
const TR_TYPE_SELL_RAM            = 61;

const TR_MULTI_ACTIONS            = 80;

const TR_LABEL_MYSELF_REGISTRATION = 100;

const TRANSACTION_TYPES = [
  TR_TYPE_STAKE_RESOURCES,
  TR_TYPE_TRANSFER,
  TR_TYPE_BUY_RAM,
  TR_TYPE_UNSTAKING_REQUEST,
  TR_TYPE_SELL_RAM,
  TR_TYPE_VOTE_FOR_BP
];


class BlockchainTrTracesDictionary {

  /**
   *
   * @returns {number}
   */
  static getTypeMultiActions() {
    return TR_MULTI_ACTIONS;
  }

  /**
   *
   * @returns {number}
   */
  static getTypeStakeWithUnstake() {
    return TR_TYPE_STAKE_WITH_UNSTAKE;
  }

  /**
   *
   * @returns {number}
   */
  static getLabelMyselfRegistration() {
    return TR_LABEL_MYSELF_REGISTRATION;
  }

  /**
   *
   * @returns {number[]}
   */
  static getAllTransactionTypes() {
    return TRANSACTION_TYPES;
  }
}

module.exports = BlockchainTrTracesDictionary;