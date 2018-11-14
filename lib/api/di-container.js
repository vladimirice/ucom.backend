const {ContainerBuilder, Reference} = require('node-dependency-injection');

const CurrentUser                 = require('../auth/current-user');
const PostService                 = require('../posts/post-service');
const UserService                 = require('../users/users-service');
const OrganizationsService        = require('../organizations/service/organization-service');
const EntityNotificationsService  = require('../entities/service').Notifications;
const BlockchainService           = require('../eos/service').Blockchain;

const CommentsService       = reqlib('/lib/comments/comments-service');

class ContainerModel {
  constructor() {
    let container = new ContainerBuilder();
    container
      .register('current-user', CurrentUser)
    ;

    // noinspection JSUnresolvedFunction
    container
      .register('post-service', PostService)
      .addArgument(new Reference('current-user'))
    ;

    // noinspection JSUnresolvedFunction
    container
      .register('user-service', UserService)
      .addArgument(new Reference('current-user'))
    ;

    // noinspection JSUnresolvedFunction
    container
      .register('comments-service', CommentsService)
      .addArgument(new Reference('current-user'))
    ;

    // noinspection JSUnresolvedFunction
    container
      .register('organizations-service', OrganizationsService)
      .addArgument(new Reference('current-user'))
    ;

    // noinspection JSUnresolvedFunction
    container
      .register('entity-notifications-service', EntityNotificationsService)
      .addArgument(new Reference('current-user'))
    ;

    // noinspection JSUnresolvedFunction
    container
      .register('blockchain-service', BlockchainService)
      .addArgument(new Reference('current-user'))
    ;

    this.container = container;
  }

  getContainer() {
    return this.container;
  }
}

module.exports = ContainerModel;