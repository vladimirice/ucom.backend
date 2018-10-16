const _ = require('lodash');
const orgGen = require('../../generators').Org;

const helpers = require('../helpers');

let userVlad;
let userJane;
let userPetr;
let userRokky;

helpers.Mock.mockAllBlockchainPart();

describe('Notifications create-update', () => {
  beforeAll(async () => {
    [userVlad, userJane, userPetr, userRokky] = await helpers.SeedsHelper.beforeAllRoutine();
  });
  afterAll(async () => {
    await helpers.SeedsHelper.sequelizeAfterAll();
  });
  beforeEach(async () => {
    await helpers.SeedsHelper.resetOrganizationRelatedSeeds();
  });

  describe('Organizations. Users team. Team invitation', () => {
    describe('Positive', () => {
      it('create valid prompt notification', async () => {
        const author = userRokky;

        const teamMembers = [
          userJane,
          userPetr
        ];

        const newOrgId = await orgGen.createOrgWithTeam(author, teamMembers);

        // assert that all related notifications are created

        const rokkyNotifications = await helpers.Notifications.requestToGetNotificationsList(userRokky);
        // Rokky is not a team member so no notifications
        expect(_.isEmpty(rokkyNotifications)).toBeTruthy();

        const vladNotifications = await helpers.Notifications.requestToGetNotificationsList(userVlad);
        // Vlad himself should not to receive any notifications
        expect(_.isEmpty(vladNotifications)).toBeTruthy();

        const janeNotifications = await helpers.Notifications.requestToGetNotificationsList(userJane);
        // One notification for Jane - join invitation
        expect (janeNotifications.length).toBe(1);

        helpers.Notifications.checkUsersTeamInvitationPromptFromDb(janeNotifications[0], userJane.id, newOrgId, true);

        const petrNotifications = await helpers.Notifications.requestToGetNotificationsList(userPetr);
        // One notification for Petr - join invitation
        expect(petrNotifications.length).toBe(1);

        helpers.Notifications.checkUsersTeamInvitationPromptFromDb(petrNotifications[0], userPetr.id, newOrgId, true);
      });

      it.skip('should receive notification if board is updated - new members are added', async () => {
        // TODO
      })
    });
  });
});