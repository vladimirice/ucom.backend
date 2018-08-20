const request = require('supertest');
const models = require('../../models');
const usersSeeds = require('../../seeders/users');
const server = require('../../app');
const expect = require('expect');
const AuthService = require('../../lib/auth/authService');

const myselfUrl = '/api/v1/myself';

const vladSeed = usersSeeds[0];


describe('Myself API', () => {

  beforeEach(async () => {
    await models['Users'].destroy({
      truncate: true
    });
    await models['Users'].bulkCreate(usersSeeds);
  });

  afterAll(async () => {
    await models.sequelize.close();
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
    const body = res.body;

    expect(body.hasOwnProperty('account_name'));
    expect(body.account_name).toMatch(usersSeeds[0].account_name);
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
  });
});
