import MockHelper = require('../helpers/mock-helper');
import SeedsHelper = require('../helpers/seeds-helper');
import CommonGenerator = require('../../generators/common-generator');
import NotificationsHelper = require('../helpers/notifications-helper');
import CommonHelper = require('../helpers/common-helper');
import OrganizationsGenerator = require('../../generators/organizations-generator');
import RequestHelper = require('../helpers/request-helper');
import ResponseHelper = require('../helpers/response-helper');

export {};

const notificationRepo = require('../../../lib/entities/repository').Notifications;

let userVlad;
let userJane;
let userPetr;

MockHelper.mockAllTransactionSigning();
MockHelper.mockAllBlockchainJobProducers();

describe('Get notifications', () => {
  beforeAll(async () => {
    [userVlad, userJane, userPetr] = await SeedsHelper.beforeAllRoutine();
  });
  afterAll(async () => {
    await SeedsHelper.sequelizeAfterAll();
  });
  beforeEach(async () => {
    await SeedsHelper.initUsersOnly();
  });

  describe('Notifications list', () => {
    it('get notifications of several types - all of them has required structure', async () => {
      await CommonGenerator.createAllTypesOfNotifications();

      let models = [];
      while (models.length < 5) {
        models = await NotificationsHelper.requestToGetNotificationsList(userJane);
      }

      const options = {
        postProcessing: 'notification',
      };

      // #task check that all notification types are exist

      CommonHelper.checkNotificationsList(models, 5, options);
    }, 10000);
  });

  describe('Pagination', () => {
    it('Smoke test. Get one without query string', async () => {
      const usersTeam = [
        userVlad,
        userPetr,
      ];

      const totalAmount = 2;
      await OrganizationsGenerator.createManyOrgWithSameTeam(userJane, usersTeam, totalAmount);

      await NotificationsHelper.requestToGetExactNotificationsAmount(userVlad, totalAmount);

      const models = await NotificationsHelper.requestToGetNotificationsList(userVlad);

      CommonHelper.checkNotificationsList(models, totalAmount);
    });

    it('Metadata', async () => {
      const author = userJane;

      const usersTeam = [
        userVlad,
        userPetr,
      ];

      const totalAmount = 6;
      await OrganizationsGenerator.createManyOrgWithSameTeam(author, usersTeam, totalAmount);

      const page    = 1;
      let perPage   = 2;

      const queryString = RequestHelper.getPaginationQueryString(page, perPage);

      await NotificationsHelper.requestToGetExactNotificationsAmount(userVlad, totalAmount);

      const response =
        await NotificationsHelper.requestToGetNotificationsList(userVlad, queryString, false);
      ResponseHelper.checkMetadataByValues(response, page, perPage, totalAmount, true);

      perPage = 3;
      const lastPage = RequestHelper.getLastPage(totalAmount, perPage);

      const queryStringLast = RequestHelper.getPaginationQueryString(
        lastPage,
        perPage,
      );

      const lastResponse =
        await NotificationsHelper.requestToGetNotificationsList(userVlad, queryStringLast, false);

      ResponseHelper.checkMetadataByValues(lastResponse, lastPage, perPage, totalAmount, false);
    });

    it('Get two pages', async () => {
      const author = userJane;

      const usersTeam = [
        userVlad,
        userPetr,
      ];

      const totalAmount = 6;
      await OrganizationsGenerator.createManyOrgWithSameTeam(author, usersTeam, totalAmount);

      await NotificationsHelper.requestToGetExactNotificationsAmount(userVlad, totalAmount);

      let page    = 1;
      const perPage   = 2;

      const queryString   = RequestHelper.getPaginationQueryString(page, perPage);
      const models = await notificationRepo.findAllUserNotificationsItselfByUserId(userVlad.id);

      const firstPage =
        await NotificationsHelper.requestToGetNotificationsList(userVlad, queryString);

      const expectedIdsOfFirstPage = [
        models[page - 1].id,
        models[page].id,
      ];

      expect(firstPage.length).toBe(perPage);

      firstPage.forEach((post, i) => {
        expect(post.id).toBe(expectedIdsOfFirstPage[i]);
      });

      page = 2;
      const queryStringSecondPage = RequestHelper.getPaginationQueryString(page, perPage);
      const secondPage =
        await NotificationsHelper.requestToGetNotificationsList(userVlad, queryStringSecondPage);

      const expectedIdsOfSecondPage = [
        models[page].id,
        models[page + 1].id,
      ];

      expect(secondPage.length).toBe(perPage);

      secondPage.forEach((post, i) => {
        expect(post.id).toBe(expectedIdsOfSecondPage[i]);
      });
    });
  });
});
