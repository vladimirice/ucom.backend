module.exports = {
  Main:                           require('../users-repository'),
  Activity:                       require('./users-activity-repository'),
  ActivityToNotification:         require('./users-activity-to-notification-repository'),
  UsersTeam:                      require('./users-team-repository'),
};