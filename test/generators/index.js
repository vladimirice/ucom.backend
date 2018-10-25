module.exports = {
  Posts:    require('./posts-generator'),
  Comments: require('./comments-generator'),
  Org:      require('./organizations-generator'),

  Entity: {
    Notifications: require('./entity/entity-notifications-generator'),
  }
};