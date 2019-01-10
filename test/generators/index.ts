export = {
  Posts:        require('./posts-generator'),
  Comments:     require('./comments-generator'),
  Org:          require('./organizations-generator'),
  Common:       require('./common-generator'),
  BlockchainTr: require('./blockchain-tr-generator'),

  Entity: {
    EventParam:     require('./entity/entity-event-param-generator'),
    Tags:           require('./entity/entity-tags-generator'),
  },
};
