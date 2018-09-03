const {ContainerBuilder, Reference} = require('node-dependency-injection');
const CurrentUser = require('../auth/current-user');
const PostService = require('../posts/post-service');
const UserService = require('../users/users-service');

class ContainerModel {
  constructor() {
    let container = new ContainerBuilder();
    container
      .register('current-user', CurrentUser)
    ;

    container
      .register('post-service', PostService)
      .addArgument(new Reference('current-user'))
    ;

    container
      .register('user-service', UserService)
      .addArgument(new Reference('current-user'))
    ;


    this.container = container;
  }

  getContainer() {
    return this.container;
  }
}

// require('..');
//
// const Mailer = require('./mailer');
// const NewsletterManager = require('./newsletter-manager');
// const path = require('path');
//
// let loader = new JsFileLoader(container);

// console.log(container);
// console.log(container2);

module.exports = ContainerModel;