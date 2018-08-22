const request = require('supertest');
const models = require('../../models');
const server = require('../../app');
const expect = require('expect');
const fs = require('fs');

const UsersHelper = require('./helpers/users-helper');
const SeedsHelper = require('./helpers/seeds-helper');
const UsersRepository = require('./../../lib/users/users-repository');

const avatarPath = `${__dirname}/../../seeders/images/ankr_network.png`;

const myselfUrl = '/api/v1/myself';

const userVlad = UsersHelper.getUserVlad();

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
    const res = await request(server)
      .get(myselfUrl)
      .set('Authorization', `Bearer ${userVlad.token}`)
    ;

    expect(res.status).toBe(200);

    UsersHelper.validateUserJson(res.body, userVlad);
  });

  it('Should return error if email is not valid', async () => {
    const fieldsToChange = {
      first_name: 'vladislav',
      last_name: 'Ivanych',
      email: 'invalidEmail'
    };

    const res = await request(server)
      .patch(myselfUrl)
      .set('Authorization', `Bearer ${userVlad.token}`)
      .send(fieldsToChange)
    ;

    expect(res.status).toBe(400);
    const body = res.body.errors;
    expect(body.length).toBe(1);

    const emailError = body.find((e) => e.field === 'email');
    expect(emailError).toBeDefined();
    expect(emailError.message).toMatch('Email is invalid');

    // Nothing is changed in DB
    const dbUser = await models['Users'].findById(userVlad.id);

    for (let fieldToChange in fieldsToChange) {
      if (fieldsToChange.hasOwnProperty(fieldToChange)) {
        expect(dbUser[fieldToChange]).toBe(userVlad[fieldToChange]);
      }
    }

  });

  it('Change logged user data', async function() {
    const fieldsToChange = {
      first_name: 'vladislav',
      last_name: 'Ivanych',
      email: 'email@example.com'
    };

    const res = await request(server)
      .patch(myselfUrl)
      .set('Authorization', `Bearer ${userVlad.token}`)
      .send(fieldsToChange)
    ;

    expect(res.status).toBe(200);
    const responseUser = res.body;

    const changedUser = await models['Users'].findById(userVlad.id);
    expect(changedUser.account_name).toBe(userVlad.account_name);

    for (let fieldToChange in fieldsToChange) {
      if (fieldsToChange.hasOwnProperty(fieldToChange)) {
        expect(changedUser[fieldToChange]).not.toBe(userVlad[fieldToChange]);
        expect(changedUser[fieldToChange]).toBe(responseUser[fieldToChange]);
      }
    }

    UsersHelper.validateUserJson(res.body, userVlad);
  });

  it('Test avatar uploading', async () => {
    expect(fs.existsSync(avatarPath)).toBeTruthy();

    const res = await request(server)
      .patch(myselfUrl)
      .set('Authorization', `Bearer ${userVlad.token}`)
      .attach('avatar_filename', avatarPath)
    ;

    expect(res.status).toBe(200);
    const body = res.body;

    expect(fs.existsSync(`${avatarStoragePath}/${body.avatar_filename}`)).toBeTruthy();

    const avatarFetchRes = await request(server)
      .get(`/upload/${body.avatar_filename}`);

    expect(avatarFetchRes.status).toBe(200);
  });

  // it('Update user education and user job', async () => {
  //   const dbUser = await UsersRepository.getUserById(userVlad.id);
  //
  // });


  it('User education and job editing', async () => {
    // const dbUser = await UsersRepository.getUserById(userVlad.id);
    // let usersEducation = [];
    //
    // dbUser.users_education.forEach((data) => {
    //   usersEducation.push(data.toJSON());
    // });
    //
    // usersEducation[0]['title'] = 'Strange University';

    // const dbUser = UR

    const fieldsToChange = {
      users_education: [{
        id: 1,
        title: 'Strange University'
      }],
    };

    const res = await request(server)
      .patch(myselfUrl)
      .set('Authorization', `Bearer ${userVlad.token}`)
      .send(fieldsToChange)
    ;

    expect(res.status).toBe(200);
    const body = res.body;

    const firstEducation = body.users_education.find((data) => data.id === 1);

    expect(firstEducation.title).toBe('Strange University');
  });
});
