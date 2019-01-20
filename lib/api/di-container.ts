const { ContainerBuilder, Reference } = require('node-dependency-injection');

const currentUser = require('../auth/current-user');
const postService = require('../posts/post-service');
const userService = require('../users/users-service');
const organizationsService = require('../organizations/service/organization-service');
const entityNotificationsService = require('../entities/service/entity-notifications-service');
const blockchainService = require('../eos/service/blockchain-service');
const commentsService = require('../comments/comments-service');

class ContainerModel {
  private readonly container;

  constructor() {
    const container = new ContainerBuilder();
    container
    // eslint-disable-next-line sonarjs/no-duplicate-string
      .register('current-user', currentUser);

    // noinspection JSUnresolvedFunction
    container
      .register('post-service', postService)
      .addArgument(new Reference('current-user'));

    // noinspection JSUnresolvedFunction
    container
      .register('user-service', userService)
      .addArgument(new Reference('current-user'));

    // noinspection JSUnresolvedFunction
    container
      .register('comments-service', commentsService)
      .addArgument(new Reference('current-user'));

    // noinspection JSUnresolvedFunction
    container
      .register('organizations-service', organizationsService)
      .addArgument(new Reference('current-user'));

    // noinspection JSUnresolvedFunction
    container
      .register('entity-notifications-service', entityNotificationsService)
      .addArgument(new Reference('current-user'));

    // noinspection JSUnresolvedFunction
    container
      .register('blockchain-service', blockchainService)
      .addArgument(new Reference('current-user'));
    this.container = container;
  }

  getContainer() {
    return this.container;
  }
}

export = ContainerModel;
