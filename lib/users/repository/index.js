module.exports = {
  ActivityUserUser: require('../activity-user-user-repository'), // @deprecated. In future will be only one table about user activity
  Main: require('../users-repository'),
  Activity: require('./users-activity-repository')
};