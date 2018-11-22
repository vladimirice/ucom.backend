module.exports = {
  Posts:    require('./posts-generator'),
  Comments: require('./comments-generator'),
  Org:      require('./organizations-generator'),
  Common:   require('./common-generator'),

  Entity: {
    Notifications:  require('./entity/entity-notifications-generator'),
    EventParam:     require('./entity/entity-event-param-generator'),
  }
};