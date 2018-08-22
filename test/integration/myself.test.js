const request = require('supertest');
const models = require('../../models');
const server = require('../../app');
const expect = require('expect');
const AuthService = require('../../lib/auth/authService');
const fs = require('fs');

const UsersHelper = require('./helpers/users-helper');
const SeedsHelper = require('./helpers/seeds-helper');

const avatarPath = `${__dirname}/../../seeders/images/ankr_network.png`;

const myselfUrl = '/api/v1/myself';

const vladSeed = UsersHelper.getUserVladSeed();

const { avatarStoragePath } = require('../../lib/users/avatar-upload-middleware');

describe('Myself API', () => {

  beforeEach(async () => {
    await SeedsHelper.initSeeds();
  });

  afterAll(async () => {
    await SeedsHelper.sequelizeAfterAll();
  });

  it ('Get 401 error to access user editing without token', async () => {
    const res = await request(server)
      .get(myselfUrl)
    ;

    expect(res.status).toBe(401);
  });

  it('Get logged user data', async function ()  {
    const token = await AuthService.getNewJwtToken(vladSeed);

    const res = await request(server)
      .get(myselfUrl)
      .set('Authorization', `Bearer ${token}`)
    ;

    expect(res.status).toBe(200);

    UsersHelper.validateUserJson(res.body, vladSeed);
  });

  it('Should return error if email is not valid', async () => {
    const token = AuthService.getNewJwtToken(vladSeed);

    const fieldsToChange = {
      first_name: 'vladislav',
      last_name: 'Ivanych',
      email: 'invalidEmail'
    };

    const res = await request(server)
      .patch(myselfUrl)
      .set('Authorization', `Bearer ${token}`)
      .send(fieldsToChange)
    ;

    expect(res.status).toBe(400);
    const body = res.body.errors;
    expect(body.length).toBe(1);

    const emailError = body.find((e) => e.field === 'email');
    expect(emailError).toBeDefined();
    expect(emailError.message).toMatch('Email is invalid');

    // Nothing is changed in DB
    const dbUser = await models['Users'].findById(vladSeed.id);

    for (let fieldToChange in fieldsToChange) {
      if (fieldsToChange.hasOwnProperty(fieldToChange)) {
        expect(dbUser[fieldToChange]).toBe(vladSeed[fieldToChange]);
      }
    }

  });

  it('Change logged user data', async function() {
    const token = await AuthService.getNewJwtToken(vladSeed);

    const fieldsToChange = {
      first_name: 'vladislav',
      last_name: 'Ivanych',
      email: 'email@example.com'
    };

    const res = await request(server)
      .patch(myselfUrl)
      .set('Authorization', `Bearer ${token}`)
      .send(fieldsToChange)
    ;

    expect(res.status).toBe(200);
    const responseUser = res.body;

    const changedUser = await models['Users'].findById(vladSeed.id);
    expect(changedUser.account_name).toBe(vladSeed.account_name);

    for (let fieldToChange in fieldsToChange) {
      if (fieldsToChange.hasOwnProperty(fieldToChange)) {
        expect(changedUser[fieldToChange]).not.toBe(vladSeed[fieldToChange]);
        expect(changedUser[fieldToChange]).toBe(responseUser[fieldToChange]);
      }
    }

    UsersHelper.validateUserJson(res.body, vladSeed);
  });

  it('Test avatar uploading', async () => {
    const token = await AuthService.getNewJwtToken(vladSeed);

    expect(fs.existsSync(avatarPath)).toBeTruthy();

    const res = await request(server)
      .patch(myselfUrl)
      .set('Authorization', `Bearer ${token}`)
      .attach('avatar_filename', avatarPath)
    ;

    expect(res.status).toBe(200);
    const body = res.body;

    expect(fs.existsSync(`${avatarStoragePath}/${body.avatar_filename}`)).toBeTruthy();

    const avatarFetchRes = await request(server)
      .get(`/upload/${body.avatar_filename}`);

    expect(avatarFetchRes.status).toBe(200);
  });
});
