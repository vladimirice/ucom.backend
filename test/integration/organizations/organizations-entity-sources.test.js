const helpers = require('../helpers');
const _ = require('lodash');
const faker = require('faker');

const OrganizationsRepositories = require('../../../lib/organizations/repository');
const EntitySourceRepository = require('../../../lib/entities/repository').Sources;
const OrgModelProvider = require('../../../lib/organizations/service/organizations-model-provider');

const request = require('supertest');
const server = require('../../../app');

let userVlad;
let userJane;
let userPetr;
let userRokky;

helpers.Org.mockBlockchainPart();

describe('Organizations. Entity source related creation-updating', () => {
  beforeAll(async () => {
    [userVlad, userJane, userPetr, userRokky] = await helpers.SeedsHelper.beforeAllRoutine();
  });

  afterAll(async () => {
    await helpers.SeedsHelper.sequelizeAfterAll();
  });

  beforeEach(async () => {
    await helpers.SeedsHelper.resetOrganizationRelatedSeeds();
  });

  describe('Searching for existing community and partnership', async () => {
    describe('Positive scenarios', () => {

      it('Find organizations as community', async () => {
        const body = await helpers.Org.requestToSearchCommunity('Inc');

        const vladResponse = body.find(data => data.id === userVlad.id);
        const janeResponse = body.find(data => data.id === userJane.id);
        expect(vladResponse).toBeDefined();
        expect(janeResponse).toBeDefined();

        const expectedFields = [
          'account_name', 'first_name', 'last_name', 'nickname', 'avatar_filename',
        ];

        expectedFields.forEach(field => {
          expect(vladResponse.hasOwnProperty(field)).toBeTruthy();
          expect(janeResponse.hasOwnProperty(field)).toBeTruthy();
        });

        expect(vladResponse.hasOwnProperty('phone_number')).toBeFalsy();
        expect(janeResponse.hasOwnProperty('about')).toBeFalsy();

        // TODO
      });

      it('should search community as case insensitive', async () => {
        // TODO
      });

      it('Find organization only even if user parameters match', async () => {
        // TODO
      });

      it('Find both users and organizations as partnership', async () => {
        // TODO
      });
    });

    describe('Negative scenarios', () => {
      it('No community if search query is wrong', async () => {
        // TODO
      });

      it('No partnership if search query is wrong', async () => {
        // TODO
      });
    });
  });

});