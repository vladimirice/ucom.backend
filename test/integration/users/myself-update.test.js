const request = require('supertest');
const models = require('../../../models');
const server = require('../../../app');
const expect = require('expect');

const helpers = require('../helpers');

const UsersHelper = require('../helpers/users-helper');
const SeedsHelper = require('../helpers/seeds-helper');
const ResponseHelper = require('../helpers/response-helper');
const FileToUploadHelper = require('../helpers/file-to-upload-helper');
const UsersRepository = require('./../../../lib/users/users-repository');

const myselfUrl = helpers.Req.getMyselfUrl();

let userVlad, userJane, userPetr, userRokky;

describe('Myself API', () => {

  beforeEach(async () => {
    [userVlad, userJane, userPetr, userRokky] = await helpers.SeedsHelper.beforeAllRoutine();
  });

  afterAll(async () => {
    await SeedsHelper.sequelizeAfterAll();
  });

  describe('Update user', () => {
    describe('Positive',  () => {
      it('Update logged user data', async () => {
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

        // TODO provide .field instead of .send as in frontend
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
        const userVlad = await UsersHelper.getUserVlad();

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

        const res = await request(server)
          .patch(myselfUrl)
          .set('Authorization', `Bearer ${userVlad.token}`)

          .field('users_sources[0][id]',              fieldsToChange.users_sources[0].id)
          .field('users_sources[0][source_url]',      fieldsToChange.users_sources[0].source_url)
          .field('users_sources[0][source_type_id]',  fieldsToChange.users_sources[0].source_type_id)

          .field('users_sources[1][source_url]',      fieldsToChange.users_sources[1].source_url)
          .field('users_sources[1][source_type_id]',  fieldsToChange.users_sources[1].source_type_id)
        ;

        expect(res.status).toBe(200);

        const body = res.body;
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

      it('Test avatar uploading', async () => {

        const fileUploadField = 'avatar_filename';
        const userVlad = await UsersHelper.getUserVlad();

        const res = await request(server)
          .patch(myselfUrl)
          .set('Authorization', `Bearer ${userVlad.token}`)
          .attach(fileUploadField, helpers.FileToUpload.getSampleFilePathToUpload())
        ;

        ResponseHelper.expectStatusOk(res);
        const body = res.body;

        await FileToUploadHelper.isFileUploaded(body[fileUploadField]);
        await UsersHelper.validateFilenameIsSaved(body, fileUploadField, userVlad.id);
      });

      it('Test achievements upload', async () => {

        const fileUploadField = 'achievements_filename';

        const userVlad = await UsersHelper.getUserVlad();

        const res = await request(server)
          .patch(myselfUrl)
          .set('Authorization', `Bearer ${userVlad.token}`)
          .attach(fileUploadField, helpers.FileToUpload.getSampleFilePathToUpload())
        ;

        ResponseHelper.expectStatusOk(res);
        const body = res.body;

        await FileToUploadHelper.isFileUploaded(body[fileUploadField]);
        await UsersHelper.validateFilenameIsSaved(body, fileUploadField, userVlad.id);
      });

      it('should be possible to update two users with empty emails - no unique error', async () => {
        const fieldsToUpdate = {
          email:        '',
          phone_number: '',
        };

        await helpers.Users.requestToUpdateMyself(userJane, fieldsToUpdate);
        await helpers.Users.requestToUpdateMyself(userVlad, fieldsToUpdate);
      });

      it('Empty values of unique fields must be written to DB as nulls', async () => {
        const fieldsToUpdate = {
          email:        '',
          phone_number: '',
        };

        const userFromResponse = await helpers.Users.requestToUpdateMyself(userVlad, fieldsToUpdate);

        expect(userFromResponse.email).toBeNull();
        expect(userFromResponse.phone_number).toBeNull();
      });
    });

    describe('Negative', () => {
      it('Not possible to update nickname or account name', async () => {
        const myself = userVlad;

        const fieldsToChange = {
          nickname:     userVlad.nickname + '12345',
          last_name:    userVlad.last_name + '12345',
          account_name: userVlad.account_name + '12345',
        };

        const user = await helpers.Users.requestToUpdateMyself(myself, fieldsToChange);

        expect(user.last_name).toBe(fieldsToChange.last_name);
        expect(user.nickname).toBe(userVlad.nickname);
        expect(user.account_name).toBe(userVlad.account_name);
      });

      it('should throw an error if NOT unique fields is provided', async () => {
        const fieldsToUpdate = {
          email:        'existingemail@gmail.com',
          phone_number: '+19161234567',
        };

        await helpers.Users.requestToUpdateMyself(userJane, fieldsToUpdate);
        const badRequestResponse = await helpers.Users.requestToUpdateMyself(userVlad, fieldsToUpdate, 400);

        const errors = badRequestResponse.errors;
        expect(errors).toBeDefined();
        expect(errors.length).toBe(2);

        expect(errors.some(error => error.field === 'phone_number')).toBeTruthy();
        expect(errors.some(error => error.field === 'email')).toBeTruthy();

        const oneFieldRes = await helpers.Users.requestToUpdateMyself(userVlad, {
          email: fieldsToUpdate.email
        }, 400);

        const oneFieldErrors = oneFieldRes.errors;
        expect(oneFieldErrors).toBeDefined();
        expect(oneFieldErrors.length).toBe(1);

        expect(oneFieldErrors.some(error => error.field === 'email')).toBeTruthy();
        expect(oneFieldErrors.some(error => error.field === 'phone')).toBeFalsy();


        const oneFieldEmail = await helpers.Users.requestToUpdateMyself(userVlad, {
          phone_number: fieldsToUpdate.phone_number
        }, 400);

        const oneFieldEmailErrors = oneFieldEmail.errors;
        expect(oneFieldEmailErrors).toBeDefined();
        expect(oneFieldEmailErrors.length).toBe(1);

        expect(oneFieldEmailErrors.some(error => error.field === 'phone_number')).toBeTruthy();
        expect(oneFieldEmailErrors.some(error => error.field === 'email')).toBeFalsy();
      });

      it ('Get 401 error to access user editing without token', async () => {
        const res = await request(server)
          .get(myselfUrl)
        ;

        expect(res.status).toBe(401);
      });
    });
  });
});
