const request = require('supertest');
const server = require('../../../app');
const expect = require('expect');
const fs = require('fs');
const EosImportance = require('../../../lib/eos/eos-importance');

const UsersHelper = require('../helpers/users-helper');
const SeedsHelper = require('../helpers/seeds-helper');
const PostHelper = require('../helpers/posts-helper');
const ResponseHelper = require('../helpers/response-helper');

const models = require('../../../models');


const PostsRepository = require('./../../../lib/posts/posts-repository');

const avatarPath = `${__dirname}/../../../seeders/images/ankr_network.png`;

const postsUrl = '/api/v1/posts';

const { avatarStoragePath } = require('../../../lib/users/avatar-upload-middleware');


describe('Posts API', () => {
  beforeEach(async () => {
    await SeedsHelper.initSeeds();
  });

  afterAll(async () => {
    await SeedsHelper.sequelizeAfterAll();
  });


  it('Update post and user rates by blockchain rates', async () => {

  });

});
