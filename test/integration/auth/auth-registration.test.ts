import SeedsHelper = require('../helpers/seeds-helper');
import UsersHelper = require('../helpers/users-helper');

const statuses = require('statuses');

describe('Test registration workflow', () => {
  beforeAll(async () => {
    await SeedsHelper.noGraphQlNoMocking();
  });

  afterAll(async () => {
    await SeedsHelper.doAfterAll();
  });

  beforeEach(async () => {
    await SeedsHelper.beforeAllRoutine();
  });

  it('Register new user', async () => {
    const { body } = await UsersHelper.registerNewUser();
    const fieldsToChange = {
      first_name: 12345,
      birthday: '',
    };

    const expectedStatus = statuses('OK');
    await UsersHelper.requestToUpdateMyselfByToken(body.token, fieldsToChange, expectedStatus);
  });

  it.skip('given public key must not match existing one', async () => {});
});

export {};
