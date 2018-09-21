const helpers = require('../helpers');
const OrganizationsRepositories = require('../../../lib/organizations/repository');

const request = require('supertest');
const server = require('../../../app');

let userVlad;
let userJane;
let userPetr;

describe('Organizations. Create-update requests', () => {
  beforeAll(async () => {
    [userVlad, userJane, userPetr] = await helpers.SeedsHelper.beforeAllRoutine();
  });

  afterAll(async () => { await helpers.SeedsHelper.sequelizeAfterAll(); });

  beforeEach(async () => {
    await helpers.SeedsHelper.resetOrganizationRelatedSeeds();
  });

  describe('Create organization', () => {
    describe('Positive scenarios', () => {
      it('should create new organization - simple fields set only', async () => {
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

      it('should sanitize user input', async () => {
        // TODO
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


      it('Malformed request to create organization', async () => {
        // TODO
      });

      it('should not be possible to create organization with wrong input data', async () => {
        // TODO
      });

      it('should throw an error if now allowed field is provided', async () => {
        // TODO
      });

      it('should throw an error if not unique field is provided', async () => {
        // TODO
      });
    });
  });

  describe('Update organization', () => {
    describe('Positive scenarios', () => {
      it('should be possible to update organization', async () => {
        const user = userVlad;
        const orgBefore = await OrganizationsRepositories.Main.findLastByAuthor(user.id);

        const avatarFilenameBefore = orgBefore.avatar_filename;

        const fieldsToChange = {
          'title': 'Changed title',
        };

        const res = await request(server)
          .patch(helpers.RequestHelper.getOneOrganizationUrl(orgBefore.id))
          .set('Authorization', `Bearer ${user.token}`)
          .field('title',  fieldsToChange.title)
          .attach('avatar_filename', helpers.FileToUpload.getSampleFilePathToUpload())
        ;

        helpers.ResponseHelper.expectStatusOk(res);

        const orgAfter = await OrganizationsRepositories.Main.findLastByAuthor(user.id);
        const avatarFilenameAfter = orgAfter.avatar_filename;

        helpers.ResponseHelper.expectValuesAreExpected(fieldsToChange, orgAfter);

        expect(avatarFilenameAfter).not.toBe(avatarFilenameBefore);
        await helpers.Organizations.isAvatarImageUploaded(avatarFilenameAfter);
      });

      it('should sanitize org updating input', async () => {
        // TODO
      });

    });
    describe('Negative scenarios', () => {
      it ('should not be possible to update org using malformed organization ID', async () => {
        // TODO
      });

      it ('should not be possible to update org using not existed organization ID', async () => {
        // TODO
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