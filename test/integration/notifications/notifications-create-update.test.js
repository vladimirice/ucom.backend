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
    await helpers.SeedsHelper.initUsersOnly();
  });

  describe('Organizations. Users team. Team invitation', () => {
    describe('Positive', () => {
      it('Create valid prompt notification when org is created.', async () => {
        const author = userVlad;

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

      it('should receive notification if board is updated - new members are added', async () => {
        // create notification if user is added to the board after updating

        const author = userVlad;
        const teamMembers = [
          userJane,
          userPetr
        ];

        const newOrgId = await orgGen.createOrgWithTeam(author, teamMembers);

        const newTeamMembers = _.concat(teamMembers, userRokky);

        await orgGen.updateOrgUsersTeam(newOrgId, author, newTeamMembers);

        const rokkyNotifications = await helpers.Notifications.requestToGetNotificationsList(userRokky);

        expect(rokkyNotifications.length).toBe(1);

        helpers.Notifications.checkUsersTeamInvitationPromptFromDb(rokkyNotifications[0], userRokky.id, newOrgId, true);
      });

      it('should provide users team status of organization', async () => {
        const author = userVlad;
        const teamMembers = [
          userJane,
          userPetr,
          userRokky
        ];

        const newOrgId = await orgGen.createOrgWithTeam(author, teamMembers);

        const org = await helpers.Org.requestToGetOneOrganizationAsGuest(newOrgId);

        const usersTeam = org.users_team;

        usersTeam.forEach(member => {
          expect(member.status).toBeDefined();
          expect(member.status).toBe(0);
        });
      });
    });
  });
});