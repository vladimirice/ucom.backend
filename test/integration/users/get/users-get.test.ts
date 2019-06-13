import { UserModel } from '../../../../lib/users/interfaces/model-interfaces';

import SeedsHelper = require('../../helpers/seeds-helper');
import UsersHelper = require('../../helpers/users-helper');
import RequestHelper = require('../../helpers/request-helper');
import UsersRepository = require('../../../../lib/users/users-repository');
import ResponseHelper = require('../../helpers/response-helper');

const request = require('supertest');

const server = RequestHelper.getApiApplication();

require('jest-expect-message');

let userVlad: UserModel;
let userPetr: UserModel;

describe('Users API', () => {
  beforeAll(async () => { await SeedsHelper.destroyTables(); });

  beforeEach(async () => {
    await SeedsHelper.initSeedsForUsers();

    // noinspection JSCheckFunctionSignatures
    [userVlad, userPetr] = await Promise.all([
      UsersHelper.getUserVlad(),
      UsersHelper.getUserPetr(),
    ]);
  });

  afterAll(async () => { await SeedsHelper.sequelizeAfterAll(); });

  it('Get myself', async () => {
    const res = await request(server)
      .get(RequestHelper.getMyselfUrl())
      .set('Authorization', `Bearer ${userVlad.token}`)
    ;

    ResponseHelper.expectStatusOk(res);

    const { body } = res;

    expect(body.is_tracking_allowed).toBeDefined();
    expect(body.is_tracking_allowed).toBeFalsy();
  });

  describe('Sorting, pagination and filtering', () => {
    it('should filter by user_name parameter', async () => {
      let queryString: string = RequestHelper.getPaginationQueryString(1, 10);
      queryString += '&sort_by=-current_rate&user_name=L'; // for smoke
      queryString += '&v2=true';

      const users = await UsersHelper.requestUserListAsGuest(queryString);
      UsersHelper.checkManyUsersPreview(users);

      expect(users.length).toBe(2);

      expect(users.some(user => user.account_name === userVlad.account_name))
        .toBeTruthy()
      ;

      expect(users.some(user => user.account_name === userPetr.account_name))
        .toBeTruthy()
      ;
    });

    it('Sort by allowed fields - smoke tests', async () => {
      let queryString = RequestHelper.getPaginationQueryString(1, 2);
      queryString += '&sort_by=-current_rate,created_at,-account_name,id';
      queryString += '&v2=true';

      const users = await UsersHelper.requestUserListAsGuest(queryString);
      UsersHelper.checkManyUsersPreview(users);
    });

    it('Get users with pagination', async () => {
      const queryString = RequestHelper.getPaginationQueryString(1, 2);

      const users = await UsersHelper.requestUserListAsGuest(queryString);

      expect(users.length).toBe(2);
      UsersHelper.checkManyUsersPreview(users);

      const queryStringFour = RequestHelper.getPaginationQueryString(1, 5);

      const usersFour = await UsersHelper.requestUserListAsGuest(queryStringFour);
      expect(usersFour.length).toBe(4);
      UsersHelper.checkManyUsersPreview(usersFour);
    });
  });

  describe('GET single user', () => {
    describe('Positive', () => {
      it('GET user by ID without auth', async () => {
        const res = await request(server)
          .get(`/api/v1/users/${userVlad.id}`)
        ;

        const { body } = res;

        expect(res.status).toBe(200);

        expect(typeof body).toBe('object');

        const user = await UsersRepository.getUserById(userVlad.id);

        const sensitiveFields = UsersRepository.getModel().getSensitiveData();

        sensitiveFields.forEach((field) => {
          // @ts-ignore
          expect(body[field], `Field ${field} is defined`).not.toBeDefined();
        });

        UsersHelper.validateUserJson(body, userVlad, user);
      });
      it('Id and related account name - user must be the same', async () => {
        const userByAccountNameRes = await request(server)
          .get(`/api/v1/users/${userVlad.account_name}`)
        ;

        ResponseHelper.expectStatusToBe(userByAccountNameRes, 200);

        const userByIdRes = await request(server)
          .get(`/api/v1/users/${userVlad.id}`)
        ;

        ResponseHelper.expectStatusToBe(userByIdRes, 200);

        expect(userByIdRes.body).toEqual(userByAccountNameRes.body);
      });
    });

    describe('Negative', () => {
      it('GET 404 if there is no user with ID', async () => {
        const res = await request(server)
          .get('/api/v1/users/1000')
        ;

        expect(res.status).toBe(404);
      });
      it('If account name is 0001 it is not equal to ID = 1', async () => {
        const res = await request(server)
          .get('/api/v1/users/000000000001')
        ;

        ResponseHelper.expectStatusToBe(res, 404);
      });
    });
  });
});

export {};
