const request = require('supertest');
const models = require('../../models');
const server = require('../../app');
const expect = require('expect');
const fs = require('fs');

const UsersHelper = require('./helpers/users-helper');
const SeedsHelper = require('./helpers/seeds-helper');
const RequestHelper = require('./helpers/request-helper');
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

  it('Get logged user data', async function ()  {
    const res = await request(server)
      .get(myselfUrl)
      .set('Authorization', `Bearer ${userVlad.token}`)
    ;

    expect(res.status).toBe(200);
    const user = await UsersRepository.getUserById(userVlad.id);

    UsersHelper.validateUserJson(res.body, userVlad, user);
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

  // it('Change logged user data', async function() {
  //   const fieldsToChange = {
  //     first_name: 'vladislav',
  //     last_name: 'Ivanych',
  //     email: 'email@example.com'
  //   };
  //
  //   const res = await request(server)
  //     .patch(myselfUrl)
  //     .set('Authorization', `Bearer ${userVlad.token}`)
  //     .send(fieldsToChange)
  //   ;
  //
  //   expect(res.status).toBe(200);
  //   const responseUser = res.body;
  //
  //   const changedUser = await models['Users'].findById(userVlad.id);
  //   expect(changedUser.account_name).toBe(userVlad.account_name);
  //
  //   for (let fieldToChange in fieldsToChange) {
  //     if (fieldsToChange.hasOwnProperty(fieldToChange)) {
  //       expect(changedUser[fieldToChange]).not.toBe(userVlad[fieldToChange]);
  //       expect(changedUser[fieldToChange]).toBe(responseUser[fieldToChange]);
  //     }
  //   }
  //
  //   UsersHelper.validateUserJson(res.body, userVlad);
  // });

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

  it('User education and job editing', async () => {

    const userHimselfFieldsToChange = {
      first_name: 'vladislav',
      last_name: 'Ivanych',
      email: 'email@example.com',
      personal_website_url: 'https://blockchain.info'
    };

    // update title of one of the education
    // add new education
    const fieldsToChange = {
      ... userHimselfFieldsToChange,

      users_education: [{
        id: 1,
        title: 'Strange University'
      }, {
        title: 'University of Mars'
      }],
      users_jobs: [
        {
          id: 1,
          title: 'Very strange job title'
        },
        {
          title: 'Kaspersky beta tester'
        },
        {
          title: 'superhero'
        }
      ]
    };

    const res = await request(server)
      .patch(myselfUrl)
      .set('Authorization', `Bearer ${userVlad.token}`)
      .send(fieldsToChange)
    ;

    expect(res.status).toBe(200);
    const body = res.body;

    const updatedUser = await UsersRepository.getUserById(userVlad.id);

    // check jobs
    const userJobs = updatedUser.users_jobs;
    const changedJob = userJobs.find(data => data.id === fieldsToChange['users_jobs'][0]['id']);
    expect(changedJob.title).toBe(fieldsToChange['users_jobs'][0]['title']);

    const newJob = userJobs.find(data => data.title === fieldsToChange['users_jobs'][2]['title']);
    expect(newJob).toBeDefined();
    expect(newJob.user_id).toBe(userVlad.id);
    expect(userJobs.length).toBe(3);

    // Check education
    const firstEducation = updatedUser.users_education.find(data => data.id === 1);
    expect(firstEducation.title).toBe('Strange University');

    const MarsEducation = updatedUser.users_education.find(data => data.title === 'University of Mars');
    expect(MarsEducation).toBeDefined();
    expect(MarsEducation.user_id).toBe(userVlad.id);
    expect(body.users_education.length).toBe(2);

    // check user itself is updated

    const responseUser = res.body;

    const changedUser = await models['Users'].findById(userVlad.id);
    expect(changedUser.account_name).toBe(userVlad.account_name);

    for (let fieldToChange in userHimselfFieldsToChange) {
      if (fieldsToChange.hasOwnProperty(fieldToChange)) {
        expect(changedUser[fieldToChange]).not.toBe(userVlad[fieldToChange]);
        expect(changedUser[fieldToChange]).toBe(responseUser[fieldToChange]);
      }
    }

    UsersHelper.validateUserJson(res.body, userVlad, updatedUser);
  });

  it('Update users sources', async () => {
    // sources of user are fixed - now only 4 sources
    // request - find all users sources by includes

    // update title of one of the education
    // add new education
    const fieldsToChange = {
      users_sources: [
        {
          id: 1,
          source_url: 'https://myurl.com',
          source_type_id: 1
        },
        {
          // create new source
          source_url: 'http://mysourceurl2.com',
          source_type_id: 2
        }
        // and delete id = 2, because it is not mentioned
      ],
    };

    const beforeUser = await UsersRepository.getUserById(userVlad.id);
    const usersSourceToDelete = beforeUser['users_sources'].find((data) => data.id === 2);

    const beforeLength = beforeUser['users_sources'].length;


    const body = await RequestHelper.sendPatch(myselfUrl, userVlad.token, fieldsToChange);
    const updatedUser = await UsersRepository.getUserById(userVlad.id);

    UsersHelper.validateUserJson(body, userVlad, updatedUser);

    const actualUserSources = updatedUser['users_sources'];

    const expectedUserSources = fieldsToChange['users_sources'];

    expectedUserSources.forEach(expectedSource => {
      const actualSource = actualUserSources.find(data => data.source_url === expectedSource.source_url);

      expect(actualSource).toBeDefined();
      expect(expectedSource.source_type_id).toBe(actualSource.source_type_id);
    });

    expect(actualUserSources.find(data => data.id === 2)).not.toBeDefined();

  });

  it ('Get 401 error to access user editing without token', async () => {
    const res = await request(server)
      .get(myselfUrl)
    ;

    expect(res.status).toBe(401);
  });
});
