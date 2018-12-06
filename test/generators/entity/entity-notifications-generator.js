const RequestHelper   = require('../../integration/helpers').Req;
const ResponseHelper  = require('../../integration/helpers').Res;

const ContentTypeDictionary   = require('ucom-libs-social-transactions').ContentTypeDictionary;

const faker = require('faker');

const EntityNotificationsRepository = require('../../../lib/entities/repository').Notifications;

const request = require('supertest');
const server = require('../../../app');

class EntityNotificationsGenerator {

}

module.exports = EntityNotificationsGenerator;