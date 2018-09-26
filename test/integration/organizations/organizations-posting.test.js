const helpers = require('../helpers');
const OrganizationsRepositories = require('../../../lib/organizations/repository');

let userVlad;
let userJane;
let userPetr;
let userRokky;

describe('Organizations. Get requests', () => {
  beforeAll(async () => {
    [userVlad, userJane, userPetr, userRokky] = await helpers.SeedsHelper.beforeAllRoutine();
  });

  afterAll(async () => {
    await helpers.SeedsHelper.sequelizeAfterAll();
  });

  beforeEach(async () => {
    await helpers.SeedsHelper.resetOrganizationRelatedSeeds();
  });

  describe('User create post on behalf of organization', () => {
    describe('Positive scenarios', () => {
        it('should be possible to create media post on behalf of organization by org author', async () => {
          // TODO
        });

        it('should be possible to create media post on behalf of organization by org team member', async () => {
          // TODO
        });

        it('should be possible to create post-offer on behalf of organization by org author', async () => {
          // TODO
        });

        it('should be possible to create post-offer post on behalf of organization by org team member', async () => {
          // TODO
        });
    });

    describe('Negative scenarios', function () {
      it('should not be possible to create post without auth token', async () => {
        // TODO
      });

      it('should not be possible to create post if you are not author or team member', async () => {
        // TODO
      });

      it('should not be possible to create post by organization which does not exist', async () => {
        // TODO
      })
    });
  });

  describe('User updates post on behalf of organization', () => {
    // Positive scenarios are covered by post updating
    describe('Negative scenarios', () => {

      it('should not be possible to update post by user who is not author', async () => {
        // TODO
      });

      it('should not be possible to update post and change or delete organization ID', async () => {
        // TODO
      });

      it('should not be possible to update post and change author_id', async () => {
        // TODO - move to post autotests
      });

    });
  });

});