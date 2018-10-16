module.exports = {
  Posts:  require('./posts-generator'),
  Org:    require('./organizations-generator'),

  Entity: {
    Notifications: require('./entity/entity-notifications-generator'),
  }
};