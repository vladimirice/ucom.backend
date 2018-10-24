const helpers = require('../helpers');
const gen     = require('../../generators');
const NotificationRepo = require('../../../lib/entities/repository').Notifications;

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
    await helpers.SeedsHelper.initUsersOnly();
  });

  describe('Pagination', async () => {
    it('Smoke test. Get one without query string', async () => {
      const usersTeam = [
        userVlad,
        userPetr
      ];

      const totalAmount = 2;
      await gen.Org.createManyOrgWithSameTeam(userJane, usersTeam, totalAmount);

      const models = await helpers.Notifications.requestToGetNotificationsList(userVlad);

      const options = helpers.Common.getOptionsForListAndMyself();
      helpers.Common.checkNotificationsList(models, totalAmount, options);
    });

    it('Metadata', async () => {
      const author = userJane;

      const usersTeam = [
        userVlad,
        userPetr
      ];

      const totalAmount = 6;
      await gen.Org.createManyOrgWithSameTeam(author, usersTeam, totalAmount);

      const page    = 1;
      let perPage   = 2;

      const queryString = helpers.Req.getPaginationQueryString(page, perPage);

      const response = await helpers.Notifications.requestToGetNotificationsList(userVlad, queryString, false);
      helpers.Res.checkMetadata(response, page, perPage, totalAmount, true);

      perPage = 3;
      let lastPage = helpers.Req.getLastPage(totalAmount, perPage);

      const queryStringLast = helpers.Req.getPaginationQueryString(
        lastPage,
        perPage
      );

      const lastResponse = await helpers.Notifications.requestToGetNotificationsList(userVlad, queryStringLast, false);

      helpers.Res.checkMetadata(lastResponse, lastPage, perPage, totalAmount, false);
    });

    it('Get two pages', async () => {
      const author = userJane;

      const usersTeam = [
        userVlad,
        userPetr
      ];

      const totalAmount = 6;
      await gen.Org.createManyOrgWithSameTeam(author, usersTeam, totalAmount);

      let page    = 1;
      let perPage   = 2;

      const queryString   = helpers.Req.getPaginationQueryString(page, perPage);
      const models        = await NotificationRepo.findAllUserNotificationsItselfByUserId(userVlad.id);

      const firstPage = await helpers.Notifications.requestToGetNotificationsList(userVlad, queryString);

      const expectedIdsOfFirstPage = [
        models[page - 1].id,
        models[page].id,
      ];

      expect(firstPage.length).toBe(perPage);

      firstPage.forEach((post, i) => {
        expect(post.id).toBe(expectedIdsOfFirstPage[i])
      });

      page = 2;
      const queryStringSecondPage = helpers.Req.getPaginationQueryString(page, perPage);
      const secondPage = await helpers.Notifications.requestToGetNotificationsList(userVlad, queryStringSecondPage);

      const expectedIdsOfSecondPage = [
        models[page].id,
        models[page + 1].id,
      ];

      expect(secondPage.length).toBe(perPage);

      secondPage.forEach((post, i) => {
        expect(post.id).toBe(expectedIdsOfSecondPage[i])
      });
    });
  });
});