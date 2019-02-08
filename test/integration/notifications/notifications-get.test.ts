export {};

const helpers = require('../helpers');
const gen     = require('../../generators');
const notificationRepo = require('../../../lib/entities/repository').Notifications;

const commonGen = require('../../generators/common-generator');

let userVlad;
let userJane;
let userPetr;
let userRokky;

helpers.Mock.mockAllTransactionSigning();
helpers.Mock.mockAllBlockchainJobProducers();

describe('Get notifications', () => {
  beforeAll(async () => {
    [userVlad, userJane, userPetr, userRokky] = await helpers.SeedsHelper.beforeAllRoutine();
  });
  afterAll(async () => {
    await helpers.SeedsHelper.sequelizeAfterAll();
  });
  beforeEach(async () => {
    await helpers.Seeds.initUsersOnly();
  });

  describe('Notifications list', () => {
    it('get notifications of several types - all of them has required structure', async () => {
      await commonGen.createAllTypesOfNotifications(userVlad, userJane, userPetr, userRokky);

      let models = [];
      while (models.length < 5) {
        models = await helpers.Notifications.requestToGetNotificationsList(userJane);
      }

      const options = {
        postProcessing: 'notification',
      };

      // #task check that all notification types are exist

      helpers.Common.checkNotificationsList(models, 5, options);
    }, 10000);
  });

  describe('Pagination', async () => {
    it('Smoke test. Get one without query string', async () => {
      const usersTeam = [
        userVlad,
        userPetr,
      ];

      const totalAmount = 2;
      await gen.Org.createManyOrgWithSameTeam(userJane, usersTeam, totalAmount);

      await helpers.Notifications.requestToGetExactNotificationsAmount(userVlad, totalAmount);

      const models = await helpers.Notifications.requestToGetNotificationsList(userVlad);

      helpers.Common.checkNotificationsList(models, totalAmount);
    });

    it('Metadata', async () => {
      const author = userJane;

      const usersTeam = [
        userVlad,
        userPetr,
      ];

      const totalAmount = 6;
      await gen.Org.createManyOrgWithSameTeam(author, usersTeam, totalAmount);

      const page    = 1;
      let perPage   = 2;

      const queryString = helpers.Req.getPaginationQueryString(page, perPage);

      await helpers.Notifications.requestToGetExactNotificationsAmount(userVlad, totalAmount);

      const response =
        await helpers.Notifications.requestToGetNotificationsList(userVlad, queryString, false);
      helpers.Res.checkMetadataByValues(response, page, perPage, totalAmount, true);

      perPage = 3;
      const lastPage = helpers.Req.getLastPage(totalAmount, perPage);

      const queryStringLast = helpers.Req.getPaginationQueryString(
        lastPage,
        perPage,
      );

      const lastResponse =
        await helpers.Notifications.requestToGetNotificationsList(userVlad, queryStringLast, false);

      helpers.Res.checkMetadataByValues(lastResponse, lastPage, perPage, totalAmount, false);
    });

    it('Get two pages', async () => {
      const author = userJane;

      const usersTeam = [
        userVlad,
        userPetr,
      ];

      const totalAmount = 6;
      await gen.Org.createManyOrgWithSameTeam(author, usersTeam, totalAmount);

      await helpers.Notifications.requestToGetExactNotificationsAmount(userVlad, totalAmount);

      let page    = 1;
      const perPage   = 2;

      const queryString   = helpers.Req.getPaginationQueryString(page, perPage);
      const models = await notificationRepo.findAllUserNotificationsItselfByUserId(userVlad.id);

      const firstPage =
        await helpers.Notifications.requestToGetNotificationsList(userVlad, queryString);

      const expectedIdsOfFirstPage = [
        models[page - 1].id,
        models[page].id,
      ];

      expect(firstPage.length).toBe(perPage);

      firstPage.forEach((post, i) => {
        expect(post.id).toBe(expectedIdsOfFirstPage[i]);
      });

      page = 2;
      const queryStringSecondPage = helpers.Req.getPaginationQueryString(page, perPage);
      const secondPage =
        await helpers.Notifications.requestToGetNotificationsList(userVlad, queryStringSecondPage);

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
