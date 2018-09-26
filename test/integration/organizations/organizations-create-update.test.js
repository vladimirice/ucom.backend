const helpers = require('../helpers');
const _ = require('lodash');
const OrganizationsRepositories = require('../../../lib/organizations/repository');
const UserActivityService = require('../../../lib/users/user-activity-service');
const OrganizationService = require('../../../lib/organizations/service/organization-service');

const request = require('supertest');
const server = require('../../../app');

let userVlad;
let userJane;
let userPetr;
let userRokky;

// noinspection JSUnusedLocalSymbols
UserActivityService._sendPayloadToRabbit = function (activity, scope) {
  console.log('SEND TO RABBIT MOCK IS CALLED');
};

OrganizationService._addSignedTransactionsForOrganizationCreation = async function (req) {
  console.log('MOCK add signed transaction is called');

  req.blockchain_id = 'sample_blockchain_id';
  req.signed_transaction = 'sample_signed_transaction';
};

describe('Organizations. Create-update requests', () => {
  beforeAll(async () => {
    [userVlad, userJane, userPetr, userRokky] = await helpers.SeedsHelper.beforeAllRoutine();
  });

  afterAll(async () => { await helpers.SeedsHelper.sequelizeAfterAll(); });

  beforeEach(async () => {
    await helpers.SeedsHelper.resetOrganizationRelatedSeeds();
  });

  describe('Create organization', () => {
    describe('Positive scenarios', () => {
      it('Should allow empty fields when creation', async () => {
        const user = userVlad;

        const res = await request(server)
          .post(helpers.RequestHelper.getOrganizationsUrl())
          .set('Authorization', `Bearer ${user.token}`)
          .field('title', 'title')
          .field('nickname', 'nickname')
          .field('personal_website_url', '')
          .field('phone_number', '')
        ;

        helpers.ResponseHelper.expectStatusCreated(res);

        const lastOrg = await OrganizationsRepositories.Main.findLastByAuthor(user.id);

        expect(lastOrg.phone_number).toBe('');
        expect(lastOrg.personal_website_url).toBe('');
      });

      it('should create new organization - simple fields set only, without board', async () => {
        let newModelFields = {
          'title': 'Extremely new org',
          'currency_to_show': 'CPX',
          'powered_by': 'CPX',
          'about': 'Extremely cool new about org',
          'nickname': 'extreme_nick',
          'email': 'extreme_email@gmail.com',
          'phone_number': '+19999999',
          'country': 'USA',
          'city': 'LA',
          'address': 'La alley, 18',
          'personal_website_url': 'https://extreme.com',
          'avatar_filename': helpers.FileToUpload.getSampleFilePathToUpload(),
        };

        const body = await helpers.Organizations.requestToCreateNewOrganization(userPetr, newModelFields);
        const lastModel = await OrganizationsRepositories.Main.findLastByAuthor(userPetr.id);
        expect(lastModel).not.toBeNull();

        expect(body.id).toBe(lastModel.id);
        expect(lastModel.avatar_filename.length).toBeGreaterThan(0);
        delete newModelFields.avatar_filename;

        newModelFields.user_id = userPetr.id;

        helpers.ResponseHelper.expectValuesAreExpected(newModelFields, lastModel);

        await helpers.Organizations.isAvatarImageUploaded(lastModel.avatar_filename);
      });

      it('should be possible to create organization and provide random extra fields', async () => {
        const user = userPetr;

        const sampleFields = helpers.Organizations.getSampleOrganizationsParams();

        const newModelFields = {
          'title'   : sampleFields.title,
          'nickname': sampleFields.nickname,
        };

        const extraFields = {
          'random_field_one': 'random_field_one_value',
          'random_field_two': 'random_field_two_value',
        };

        const res = await request(server)
          .post(helpers.RequestHelper.getOrganizationsUrl())
          .set('Authorization', `Bearer ${user.token}`)
          .field('title', newModelFields.title)
          .field('nickname', newModelFields.nickname)
          .field('random_field_one', extraFields.random_field_one)
          .field('random_field_two', extraFields.random_field_two)
        ;

        const lastModel = await OrganizationsRepositories.Main.findLastByAuthor(userPetr.id);
        expect(lastModel).not.toBeNull();

        helpers.ResponseHelper.expectStatusCreated(res);
        helpers.ResponseHelper.expectValuesAreExpected(newModelFields, lastModel);

        expect(lastModel.random_field_one).not.toBeDefined();
        expect(lastModel.random_field_two).not.toBeDefined();
      });

      it('should be possible to create two organizations with empty emails - no unique error', async () => {
        const countBefore = await OrganizationsRepositories.Main.countAllOrganizations();

        const requestOnePromise = request(server)
          .post(helpers.RequestHelper.getOrganizationsUrl())
          .set('Authorization', `Bearer ${userPetr.token}`)
          .field('title', 'Title12345')
          .field('nickname', '123nickname123')
          .field('email', '')
          .field('currency_to_show', '')
        ;
        const requestTwoPromise = request(server)
          .post(helpers.RequestHelper.getOrganizationsUrl())
          .set('Authorization', `Bearer ${userPetr.token}`)
          .field('title', 'Title1234567')
          .field('nickname', '123nickname123567')
          .field('email', '')
          .field('currency_to_show', '')
        ;

        const [resultOne, resultTwo] = await Promise.all([
          requestOnePromise,
          requestTwoPromise
        ]);

        helpers.ResponseHelper.expectStatusCreated(resultOne);
        helpers.ResponseHelper.expectStatusCreated(resultTwo);

        const countAfter = await OrganizationsRepositories.Main.countAllOrganizations();

        expect(countAfter).toBe(countBefore + 2);
      });

      it('Empty values of unique fields must be written to DB as nulls', async () => {
        const user = userPetr;

        const res = await request(server)
          .post(helpers.RequestHelper.getOrganizationsUrl())
          .set('Authorization', `Bearer ${user.token}`)
          .field('title', 'Title12345')
          .field('nickname', '123nickname123')
          .field('email', '')
          .field('currency_to_show', '')
        ;
        helpers.ResponseHelper.expectStatusCreated(res);

        const lastOrg = await OrganizationsRepositories.Main.findLastByAuthor(user.id);

        expect(lastOrg.id).toBe(res.body.id);
        expect(lastOrg.email).toBeNull();
        expect(lastOrg.currency_to_show).toBe('');

      });

      it('should sanitize user input when creation is in process', async () => {

        const sampleFields = helpers.Organizations.getSampleOrganizationsParams();

        let infectedFields = _.clone(sampleFields);
        const textFields = OrganizationsRepositories.Main.getModelSimpleTextFields();

        const injection = '<script>alert("Hello");</script><img src="https://hacked.url"/>';

        textFields.forEach(field => {
          if (infectedFields[field]) {
            infectedFields[field] += injection;
          }
        });

        await helpers.Organizations.requestToCreateNewOrganization(userPetr, infectedFields);
        const lastModel = await OrganizationsRepositories.Main.findLastByAuthor(userPetr.id);

        delete sampleFields.avatar_filename;

        helpers.ResponseHelper.expectValuesAreExpected(sampleFields, lastModel);
      });

      it('should allow to add board to the organization', async () => {
        const author = userVlad;
        const newPostUsersTeamFields = [
          {
            'user_id': userJane.id,
          },
          {
            'user_id': userPetr.id,
          },
        ];

        const res = await request(server)
          .post(helpers.Req.getOrganizationsUrl())
          .set('Authorization', `Bearer ${author.token}`)
          .field('title',             'sample_title')
          .field('nickname',          'sample_nickname')
          .field('users_team[0][id]', newPostUsersTeamFields[0]['user_id'])
          .field('users_team[1][id]', newPostUsersTeamFields[1]['user_id'])
          .field('users_team[2][id]', author.id)
        ;

        helpers.Res.expectStatusCreated(res);

        const lastModel = await OrganizationsRepositories.Main.findLastByAuthor(author.id);

        const usersTeam = lastModel['users_team'];
        expect(usersTeam).toBeDefined();
        expect(usersTeam.length).toBe(2);

        newPostUsersTeamFields.forEach(teamMember => {
          const record = usersTeam.find(data => data.user_id === teamMember.user_id);
          expect(record).toBeDefined();
          expect(+record.entity_id).toBe(+lastModel.id);
          expect(record.entity_name).toMatch('org');
          expect(record.status).toBe(0);
        });

        // should not add author to the board - ignore it
        expect(usersTeam.some(data => data.user_id === author.id)).toBeFalsy();
      });
    });

    describe('Negative scenarios', () => {
      it('Not possible to create organization without auth token', async () => {
        const res = await request(server)
          .post(helpers.RequestHelper.getOrganizationsUrl())
          .field('title', 'sample_title')
        ;

        helpers.ResponseHelper.expectStatusUnauthorized(res);
      });

      it('should not be possible to create organization without required fields', async () => {

        const res = await request(server)
          .post(helpers.RequestHelper.getOrganizationsUrl())
          .set('Authorization', `Bearer ${userPetr.token}`)
          .field('email', 'email@google.com')
        ;

        helpers.ResponseHelper.expectStatusBadRequest(res);

        const errors = res.body.errors;

        expect(errors).toBeDefined();

        const titleError = errors.find(error => error.field === 'title');
        expect(titleError).toBeDefined();
        expect(titleError.message).toMatch('required');

        const nicknameError = errors.find(error => error.field === 'nickname');
        expect(nicknameError).toBeDefined();
        expect(nicknameError.message).toMatch('required');
      });

      it('should not be possible to create organization with malformed email or url', async () => {
        const res = await request(server)
          .post(helpers.RequestHelper.getOrganizationsUrl())
          .set('Authorization', `Bearer ${userPetr.token}`)
          .field('title', 'my_own_title')
          .field('nickname', 'my_own_nickname')
          .field('email', 'wrong_email')
          .field('personal_website_url', 'wrong_url')
        ;

        helpers.ResponseHelper.expectStatusBadRequest(res);

        const errors = res.body.errors;

        expect(errors.some(data => data.field === 'email')).toBeTruthy();
        expect(errors.some(data => data.field === 'personal_website_url')).toBeTruthy();
      });

      it('should not be possible to set organization ID or user_id directly', async () => {
        const res = await request(server)
          .post(helpers.RequestHelper.getOrganizationsUrl())
          .set('Authorization', `Bearer ${userPetr.token}`)
          .field('title', 'my_own_title')
          .field('nickname', 'my_own_nickname')
          .field('id', 100500)
          .field('user_id', userVlad.id)
        ;

        helpers.ResponseHelper.expectStatusCreated(res);

        const lastOrg = await OrganizationsRepositories.Main.findLastByAuthor(userPetr.id);

        expect(lastOrg.id).toBe(res.body.id);
        expect(lastOrg.id).not.toBe(100500);
        expect(lastOrg.user_id).not.toBe(userVlad.id);
      });

      it('should throw an error if NOT unique fields is provided', async () => {
        const user = userVlad;

        const existingOrg = await OrganizationsRepositories.Main.findFirstByAuthor(user.id);

        const twoFieldsRes = await request(server)
          .post(helpers.RequestHelper.getOrganizationsUrl())
          .set('Authorization', `Bearer ${user.token}`)
          .field('title', 'somehow new title')
          .field('email', existingOrg.email)
          .field('nickname', existingOrg.nickname)
        ;

        helpers.ResponseHelper.expectStatusBadRequest(twoFieldsRes);

        const errors = twoFieldsRes.body.errors;
        expect(errors).toBeDefined();
        expect(errors.length).toBe(2);

        expect(errors.some(error => error.field === 'nickname')).toBeTruthy();
        expect(errors.some(error => error.field === 'email')).toBeTruthy();

        const oneFieldRes = await request(server)
          .post(helpers.RequestHelper.getOrganizationsUrl())
          .set('Authorization', `Bearer ${user.token}`)
          .field('title', 'somehow new title')
          .field('email', 'unique_email@gmail.com')
          .field('nickname', existingOrg.nickname)
        ;

        helpers.ResponseHelper.expectStatusBadRequest(oneFieldRes);

        const oneFieldErrors = oneFieldRes.body.errors;
        expect(oneFieldErrors).toBeDefined();
        expect(oneFieldErrors.length).toBe(1);

        expect(oneFieldErrors.some(error => error.field === 'nickname')).toBeTruthy();
        expect(oneFieldErrors.some(error => error.field === 'email')).toBeFalsy();

        // If only one duplication then only one error
      });
    });
  });

  describe('Update organization', () => {
    describe('Positive scenarios', () => {
      it('should be possible to update organization with users team updating', async () => {
        const org_id = 1;
        const user = userVlad;
        const orgBefore = await OrganizationsRepositories.Main.findOneById(org_id);

        const avatarFilenameBefore = orgBefore.avatar_filename;

        let sampleOrganizationFields = helpers.Organizations.getSampleOrganizationsParams();
        sampleOrganizationFields.title = 'New title which is changed';

        // remove Jane, add Rokky and preserve Petr
        const newUsersTeam = [
          {
            user_id: userPetr.id
          },
          {
            user_id: userRokky.id
          },
          {
            user_id: user.id // try to add author to the board - should be ignored // TODO
          }
        ];

        await helpers.Organizations.requestToUpdateOrganization(
          orgBefore.id,
          user,
          sampleOrganizationFields,
          newUsersTeam
        );

        const orgAfter = await OrganizationsRepositories.Main.findOneById(org_id);
        const avatarFilenameAfter = orgAfter.avatar_filename;

        delete sampleOrganizationFields.avatar_filename;

        helpers.ResponseHelper.expectValuesAreExpected(sampleOrganizationFields, orgAfter);

        expect(avatarFilenameAfter).not.toBe(avatarFilenameBefore);
        await helpers.Organizations.isAvatarImageUploaded(avatarFilenameAfter);

        const usersTeam = orgAfter['users_team'];
        expect(usersTeam).toBeDefined();

        expect(usersTeam.some(data => data.user_id === userJane.id)).toBeFalsy();
        expect(usersTeam.some(data => data.user_id === userRokky.id)).toBeTruthy();
        expect(usersTeam.some(data => data.user_id === userPetr.id)).toBeTruthy();
        expect(usersTeam.some(data => data.user_id === userVlad.id)).toBeFalsy();
      });

      it('should be possible to remove all board by clearing it', async () => {
        // TODO
      });

      it('should sanitize org updating input', async () => {
        const org_id = 1;
        const user = userVlad;

        const injection = '<script>alert("Hello");</script><img src="https://hacked.url"/>';

        let newModelFields = {
          'title': 'expectedTitle',
          'nickname': 'expectedNickname',
          'powered_by': 'PAI',
          'about': 'expectedAbout',
          'country': 'Russia',
        };

        let infectedFields = {};
        for (const field in newModelFields) {
          infectedFields[field] = newModelFields[field] + injection;
        }

        const res = await request(server)
          .patch(helpers.RequestHelper.getOneOrganizationUrl(org_id))
          .set('Authorization', `Bearer ${user.token}`)
          .field('title',       infectedFields.title)
          .field('nickname',    infectedFields.nickname)
          .field('powered_by',  infectedFields.powered_by)
          .field('about',       infectedFields.about)
          .field('country',     infectedFields.country)
        ;

        helpers.ResponseHelper.expectStatusOk(res);

        const lastModel = await OrganizationsRepositories.Main.findOneById(org_id);

        helpers.ResponseHelper.expectValuesAreExpected(newModelFields, lastModel);
      });

      it('should be possible to update organization itself without changing unique fields - no unique error', async () => {
        const org_id = 1;
        const user = userVlad;

        const org = await OrganizationsRepositories.Main.findOneById(org_id);

        let newModelFields = {
          'title':    org.title,
          'nickname': org.nickname,
          'email':    org.email,
          'about':    'expectedAbout',
        };

        const res = await request(server)
          .patch(helpers.RequestHelper.getOneOrganizationUrl(org_id))
          .set('Authorization', `Bearer ${user.token}`)
          .field('title',       newModelFields.title)
          .field('nickname',    newModelFields.nickname)
          .field('email',       newModelFields.email)
          .field('about',       newModelFields.about)
        ;

        helpers.ResponseHelper.expectStatusOk(res);

        const lastModel = await OrganizationsRepositories.Main.findOneById(org_id);

        helpers.ResponseHelper.expectValuesAreExpected(newModelFields, lastModel);
      });

      it('should be possible to update organization with random extra fields', async () => {
        // Required because frontend will send fields which are not been implemented in backend
        const user = userJane;
        const orgBefore = await OrganizationsRepositories.Main.findLastByAuthor(user.id);
        const org_id = orgBefore.id;

        const fieldsToChange = {
          'title': 'Changed title from extremely to',
          'nickname': 'changed_nickname'
        };

        const extraFields = {
          'random_field_one': 'random_field_one_value',
          'random_field_two': 'random_field_two_value',
        };

        const res = await request(server)
          .patch(helpers.RequestHelper.getOneOrganizationUrl(org_id))
          .set('Authorization', `Bearer ${user.token}`)
          .field('title', fieldsToChange.title)
          .field('nickname', fieldsToChange.nickname)
          .field('random_field_one', extraFields.random_field_one)
          .field('random_field_two', extraFields.random_field_two)
        ;

        helpers.ResponseHelper.expectStatusOk(res);

        const orgAfter = await OrganizationsRepositories.Main.findOneById(org_id);

        helpers.ResponseHelper.expectValuesAreExpected(fieldsToChange, orgAfter);

        expect(orgAfter.random_field_one).not.toBeDefined();
        expect(orgAfter.random_field_two).not.toBeDefined();
      });
    });
    describe('Negative scenarios', () => {
      it ('should not be possible to update org using malformed organization ID', async () => {
        const currentOrgId = 'malformed';

        // noinspection JSCheckFunctionSignatures
        const res = await request(server)
          .patch(helpers.RequestHelper.getOneOrganizationUrl(currentOrgId))
          .set('Authorization', `Bearer ${userVlad.token}`)
          .field('title',     'new_title')
          .field('nickname',  'new_nickname')
        ;

        helpers.ResponseHelper.expectStatusBadRequest(res);
      });

      it ('should not be possible to update org using not existed organization ID', async () => {
        const currentOrgId = 100500;

        const res = await request(server)
          .patch(helpers.RequestHelper.getOneOrganizationUrl(currentOrgId))
          .set('Authorization', `Bearer ${userVlad.token}`)
          .field('title',     'new_title')
          .field('nickname',  'new_nickname')
        ;

        helpers.ResponseHelper.expectStatusNotFound(res);
      });

      it('should be two errors if one org has given email, and other has given nickname', async () => {
        const currentOrgId = 1;
        const orgIdToTakeEmail = 2;
        const orgIdToTakeNickname = 3;

        const [currentOrg, orgToTakeEmail, orgToTakeNickname] = await Promise.all([
          OrganizationsRepositories.Main.findOneById(currentOrgId),
          OrganizationsRepositories.Main.findOneById(orgIdToTakeEmail),
          OrganizationsRepositories.Main.findOneById(orgIdToTakeNickname)
        ]);

        const newModelFields = {
          'title':    currentOrg.title,
          'email':    orgToTakeEmail.email,
          'nickname': orgToTakeNickname.nickname,
        };

        const res = await request(server)
          .patch(helpers.RequestHelper.getOneOrganizationUrl(currentOrgId))
          .set('Authorization', `Bearer ${userVlad.token}`)
          .field('title',     newModelFields.title)
          .field('email',     newModelFields.email)
          .field('nickname',  newModelFields.nickname)
        ;

        helpers.ResponseHelper.expectStatusBadRequest(res);
        const errors = res.body.errors;

        expect(errors.length).toBe(2);

        expect(errors).toBeDefined();
        expect(errors.some(error => error.field === 'email')).toBeTruthy();
        expect(errors.some(error => error.field === 'nickname')).toBeTruthy();
      });

      it('should not be possible to update with given nickname, if email is same as given org but nickname is same as in other org', async () => {
        const current_org_id = 1;
        const other_org_id = 2;

        const [currentOrg, otherOrg] = await Promise.all([
          OrganizationsRepositories.Main.findOneById(current_org_id),
          OrganizationsRepositories.Main.findOneById(other_org_id)
        ]);

        const newModelFields = {
          'title':    currentOrg.title,
          'email':    currentOrg.email,
          'nickname': otherOrg.nickname,
        };

        const res = await request(server)
          .patch(helpers.RequestHelper.getOneOrganizationUrl(current_org_id))
          .set('Authorization', `Bearer ${userVlad.token}`)
          .field('title', newModelFields.title)
          .field('email', newModelFields.email)
          .field('nickname', newModelFields.nickname)
        ;

        helpers.ResponseHelper.expectStatusBadRequest(res);
        const errors = res.body.errors;
        expect(errors.length).toBe(1);

        expect(errors).toBeDefined();
        expect(errors.some(error => error.field === 'email')).toBeFalsy();
        expect(errors.some(error => error.field === 'nickname')).toBeTruthy();
      });

      it('should not be possible to update org without auth token', async () => {
        const org_id = 1;

        const res = await request(server)
          .patch(helpers.RequestHelper.getOneOrganizationUrl(org_id))
          .field('title',  'Sample title to change')
        ;

        helpers.ResponseHelper.expectStatusUnauthorized(res);
      });
    });
  });
});