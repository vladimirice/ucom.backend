import { UserModel } from '../../../lib/users/interfaces/model-interfaces';
import { JEST_TIMEOUT_DEBUG } from '../../helpers/jest-dictionary';

import SeedsHelper = require('../helpers/seeds-helper');
import OrganizationsHelper = require('../helpers/organizations-helper');
import RequestHelper = require('../helpers/request-helper');
import ResponseHelper = require('../helpers/response-helper');
import FileToUploadHelper = require('../helpers/file-to-upload-helper');
import UsersHelper = require('../helpers/users-helper');
import OrganizationsGenerator = require('../../generators/organizations-generator');
import OrgsCurrentParamsRepository = require('../../../lib/organizations/repository/organizations-current-params-repository');
import OrganizationsRepository = require('../../../lib/organizations/repository/organizations-repository');
import EntitySourcesRepository = require('../../../lib/entities/repository/entity-sources-repository');
import CommonChecker = require('../../helpers/common/common-checker');
import OrganizationsModelProvider = require('../../../lib/organizations/service/organizations-model-provider');
import BlockchainUniqId = require('../../../lib/eos/eos-blockchain-uniqid');

const request = require('supertest');
const _ = require('lodash');
const faker = require('faker');

const server = RequestHelper.getApiApplication();

let userVlad: UserModel;
let userJane: UserModel;
let userPetr: UserModel;
let userRokky: UserModel;

const JEST_TIMEOUT = 5000;

describe('Organizations. Create-update requests', () => {
  beforeAll(async () => { await SeedsHelper.noGraphQlNoMocking(); });
  afterAll(async () => { await SeedsHelper.afterAllWithoutGraphQl(); });

  beforeEach(async () => {
    [userVlad, userJane, userPetr, userRokky] = await SeedsHelper.beforeAllRoutine();
  });

  describe('Create organization', () => {
    it('Smoke - create organization with the multi-signature', async () => {
      await OrganizationsGenerator.createOrgWithoutTeam(userVlad, {
        is_multi_signature: true,
      });
    }, JEST_TIMEOUT_DEBUG);

    describe('Positive scenarios', () => {
      it('Post current params row should be created during post creation', async () => {
        const entityId: number = await OrganizationsGenerator.createOrgWithoutTeam(userVlad);

        const data = await OrgsCurrentParamsRepository.getCurrentStatsByEntityId(entityId);

        OrganizationsHelper.checkOneNewEntityCurrentParams(data, true);
      });

      it('should be possible to create one with social networks', async () => {
        const user = userVlad;

        const fields = {
          title: 'new title',
          nickname: 'new_nick_name',
        };

        const socialNetworks = [
          {
            source_url: 'https://myurl.com',
            source_type_id: 1,
            // source_group_id: 1, - is set by social networks block
            // entity_id: 1 - organization ID
            // entity_name: org,
            // text_data: // JSON - text, description
          },
          {
            source_url: 'http://mysourceurl2.com',
            source_type_id: 2,
          },
        ];

        const sourcesToInsert = {
          social_networks: socialNetworks,
        };

        const body = await OrganizationsHelper.requestToCreateNew(user, fields, sourcesToInsert);

        const sources = await EntitySourcesRepository.findAllByEntity(body.id, 'org');

        expect(sources.length).toBe(socialNetworks.length);

        for (const expected of socialNetworks) {
          const actual = sources.find((data) => data.source_url === expected.source_url);

          expect(actual.source_type_id).toBe(expected.source_type_id);
          expect(actual.source_group_id).toBe(1);

          expect(actual.text_data).toBe('');
          // noinspection JSCheckFunctionSignatures
          expect(actual.is_official).toBe(false);
          expect(actual.source_entity_id).toBeNull();
          expect(actual.source_entity_name).toBeNull();
        }
      }, JEST_TIMEOUT);

      it('Should allow empty fields when creation', async () => {
        const user = userVlad;

        const res = await request(server)
          .post(RequestHelper.getOrganizationsUrl())
          .set('Authorization', `Bearer ${user.token}`)
          .field('title', 'title')
          .field('nickname', 'nickname')
          .field('personal_website_url', '')
          .field('phone_number', '')
          .field('signed_transaction', 'signed_transaction')
          .field('blockchain_id', BlockchainUniqId.getUniqidByScope('organizations'))
        ;

        ResponseHelper.expectStatusCreated(res);

        const lastOrg = await OrganizationsRepository.findLastByAuthor(user.id);

        expect(lastOrg.phone_number).toBe('');
        expect(lastOrg.personal_website_url).toBe('');
      });

      it('should create new organization - simple fields set only, without board', async () => {
        const newModelFields: any = {
          title: 'Extremely new org',
          currency_to_show: 'CPX',
          powered_by: 'CPX',
          about: 'Extremely cool new about org',
          nickname: 'extreme_nick',
          email: 'extreme_email@gmail.com',
          phone_number: '+19999999',
          country: 'USA',
          city: 'LA',
          address: 'La alley, 18',
          personal_website_url: 'https://extreme.com',
          avatar_filename: FileToUploadHelper.getSamplePngPath(),
        };

        // noinspection JSDeprecatedSymbols
        const body =
          await OrganizationsHelper.requestToCreateNewOrganization(userPetr, newModelFields);
        const lastModel = await OrganizationsRepository.findLastByAuthor(userPetr.id);
        expect(lastModel).not.toBeNull();

        expect(body.id).toBe(lastModel.id);
        expect(lastModel.avatar_filename.length).toBeGreaterThan(0);
        delete newModelFields.avatar_filename;

        newModelFields.user_id = userPetr.id;

        ResponseHelper.expectValuesAreExpected(newModelFields, lastModel);

        await OrganizationsHelper.isAvatarImageUploaded(lastModel.avatar_filename);
      });

      it('should be possible to create organization and provide random extra fields', async () => {
        const user = userPetr;

        const sampleFields = OrganizationsHelper.getSampleOrganizationsParams();

        const newModelFields = {
          title   : sampleFields.title,
          nickname: sampleFields.nickname,
        };

        const extraFields = {
          random_field_one: 'random_field_one_value',
          random_field_two: 'random_field_two_value',
        };

        const req = request(server)
          .post(RequestHelper.getOrganizationsUrl())
          .set('Authorization', `Bearer ${user.token}`)
          .field('title', newModelFields.title)
          .field('nickname', newModelFields.nickname)
          .field('random_field_one', extraFields.random_field_one)
          .field('random_field_two', extraFields.random_field_two)
          .field('signed_transaction', 'signed_transaction')
          .field('random_field_two', extraFields.random_field_two)
        ;

        RequestHelper.addFakeSignedTransactionString(req);
        RequestHelper.addFakeBlockchainIdForOrganization(req);

        const res = await req;

        const lastModel = await OrganizationsRepository.findLastByAuthor(userPetr.id);
        expect(lastModel).not.toBeNull();

        ResponseHelper.expectStatusCreated(res);
        ResponseHelper.expectValuesAreExpected(newModelFields, lastModel);

        expect(lastModel.random_field_one).not.toBeDefined();
        expect(lastModel.random_field_two).not.toBeDefined();
      });

      // tslint:disable-next-line:max-line-length
      it('should be possible to create two organizations with empty emails - no unique error', async () => {
        const countBefore = await OrganizationsRepository.countAllOrganizations();

        const requestOnePromise = request(server)
          .post(RequestHelper.getOrganizationsUrl())
          .set('Authorization', `Bearer ${userPetr.token}`)
          .field('title', 'Title12345')
          .field('nickname', '123nickname123')
          .field('email', '')
          .field('currency_to_show', '')
        ;

        RequestHelper.addFakeSignedTransactionString(requestOnePromise);
        RequestHelper.addFakeBlockchainIdForOrganization(requestOnePromise);

        const requestTwoPromise = request(server)
          .post(RequestHelper.getOrganizationsUrl())
          .set('Authorization', `Bearer ${userPetr.token}`)
          .field('title', 'Title1234567')
          .field('nickname', '123nickname123567')
          .field('email', '')
          .field('currency_to_show', '')
        ;

        RequestHelper.addFakeSignedTransactionString(requestTwoPromise);
        RequestHelper.addFakeBlockchainIdForOrganization(requestTwoPromise);

        const [resultOne, resultTwo] = await Promise.all([
          requestOnePromise,
          requestTwoPromise,
        ]);

        ResponseHelper.expectStatusCreated(resultOne);
        ResponseHelper.expectStatusCreated(resultTwo);

        const countAfter = await OrganizationsRepository.countAllOrganizations();

        expect(countAfter).toBe(countBefore + 2);
      }, JEST_TIMEOUT * 3);

      it('Empty values of unique fields must be written to DB as nulls', async () => {
        const user = userPetr;


        const req = request(server)
          .post(RequestHelper.getOrganizationsUrl())
          .set('Authorization', `Bearer ${user.token}`)
          .field('title', 'Title12345')
          .field('nickname', '123nickname123')
          .field('email', '')
          .field('currency_to_show', '')
        ;

        RequestHelper.addFakeSignedTransactionString(req);
        RequestHelper.addFakeBlockchainIdForOrganization(req);
        const res = await req;

        ResponseHelper.expectStatusCreated(res);

        const lastOrg = await OrganizationsRepository.findLastByAuthor(user.id);

        expect(lastOrg.id).toBe(res.body.id);
        expect(lastOrg.email).toBeNull();
        expect(lastOrg.currency_to_show).toBe('');
      });

      it('should sanitize user input when creation is in process', async () => {
        const sampleFields = OrganizationsHelper.getSampleOrganizationsParams();

        const infectedFields = _.clone(sampleFields);
        const textFields = OrganizationsRepository.getModelSimpleTextFields();

        const injection = '<script>alert("Hello");</script><img src="https://hacked.url"/>';

        textFields.forEach((field) => {
          if (infectedFields[field]) {
            infectedFields[field] += injection;
          }
        });

        // noinspection JSDeprecatedSymbols
        await OrganizationsHelper.requestToCreateNewOrganization(userPetr, infectedFields);
        const lastModel = await OrganizationsRepository.findLastByAuthor(userPetr.id);

        delete sampleFields.avatar_filename;

        ResponseHelper.expectValuesAreExpected(sampleFields, lastModel);
      });

      it('should delete all board members', async () => {
        const firstOrgId: number =
          await OrganizationsGenerator.createOrgWithTeamAndConfirmAll(userVlad, [userJane, userPetr]);
        const secondOrgId: number =
          await OrganizationsGenerator.createOrgWithTeamAndConfirmAll(userVlad, [userJane, userPetr]);

        await OrganizationsHelper.deleteAllFromArray(userVlad, firstOrgId, 'users_team');

        const firstOrgModel = await OrganizationsRepository.findOneById(firstOrgId);
        CommonChecker.expectEmpty(firstOrgModel.users_team);

        const secondOrgModel = await OrganizationsRepository.findOneById(secondOrgId);
        CommonChecker.expectNotEmpty(secondOrgModel.users_team);
      }, JEST_TIMEOUT * 3);

      it('should allow to add board to the organization', async () => {
        const author = userVlad;
        const newPostUsersTeamFields = [
          {
            user_id: userJane.id,
          },
          {
            user_id: userPetr.id,
          },
        ];

        const req = request(server)
          .post(RequestHelper.getOrganizationsUrl())
          .set('Authorization', `Bearer ${author.token}`)
          .field('title',             'sample_title')
          .field('nickname',          'sample_nickname')
          .field('users_team[0][id]', newPostUsersTeamFields[0].user_id)
          .field('users_team[1][id]', newPostUsersTeamFields[1].user_id)
          .field('users_team[2][id]', author.id)
        ;

        RequestHelper.addFakeSignedTransactionString(req);
        RequestHelper.addFakeBlockchainIdForOrganization(req);

        const res = await req;

        ResponseHelper.expectStatusCreated(res);

        await UsersHelper.directlySetUserConfirmsInvitation(+res.body.id, userJane);
        await UsersHelper.directlySetUserConfirmsInvitation(+res.body.id, userPetr);

        const lastModel = await OrganizationsRepository.findLastByAuthor(author.id);

        const usersTeam = lastModel.users_team;
        expect(usersTeam).toBeDefined();
        expect(usersTeam.length).toBe(2);

        newPostUsersTeamFields.forEach((teamMember) => {
          const record = usersTeam.find((data) => data.user_id === teamMember.user_id);
          expect(record).toBeDefined();
          expect(+record.entity_id).toBe(+lastModel.id);
          expect(record.entity_name).toMatch('org');
          expect(record.status).toBe(1);
        });

        // should not add author to the board - ignore it
        expect(usersTeam.some((data) => data.user_id === author.id)).toBeFalsy();
      });
    });

    describe('Negative scenarios', () => {
      it('Not possible to create organization without auth token', async () => {
        const res = await request(server)
          .post(RequestHelper.getOrganizationsUrl())
          .field('title', 'sample_title')
        ;

        ResponseHelper.expectStatusUnauthorized(res);
      });

      it('should not be possible to create organization without required fields', async () => {
        const req = request(server)
          .post(RequestHelper.getOrganizationsUrl())
          .set('Authorization', `Bearer ${userPetr.token}`)
          .field('email', 'email@google.com')
        ;

        RequestHelper.addFakeSignedTransactionString(req);
        RequestHelper.addFakeBlockchainIdForOrganization(req);

        const res = await req;

        ResponseHelper.expectStatusBadRequest(res);

        const { errors } = res.body;

        expect(errors).toBeDefined();

        const titleError = errors.find((error) => error.field === 'title');
        expect(titleError).toBeDefined();
        expect(titleError.message).toMatch('required');

        const nicknameError = errors.find((error) => error.field === 'nickname');
        expect(nicknameError).toBeDefined();
        expect(nicknameError.message).toMatch('required');
      });

      it('should not be possible to create organization with malformed email or url', async () => {
        const req = request(server)
          .post(RequestHelper.getOrganizationsUrl())
          .set('Authorization', `Bearer ${userPetr.token}`)
          .field('title', 'my_own_title')
          .field('nickname', 'my_own_nickname')
          .field('email', 'wrong_email')
          .field('personal_website_url', 'wrong_url')
        ;

        RequestHelper.addFakeSignedTransactionString(req);
        RequestHelper.addFakeBlockchainIdForOrganization(req);

        const res = await req;

        ResponseHelper.expectStatusBadRequest(res);

        const { errors } = res.body;

        expect(errors.some((data) => data.field === 'email')).toBeTruthy();
        expect(errors.some((data) => data.field === 'personal_website_url')).toBeTruthy();
      });

      it('should not be possible to set organization ID or user_id directly', async () => {
        const req = request(server)
          .post(RequestHelper.getOrganizationsUrl())
          .set('Authorization', `Bearer ${userPetr.token}`)
          .field('title', 'my_own_title')
          .field('nickname', 'my_own_nickname')
          .field('id', 100500)
          .field('user_id', userVlad.id)
        ;

        RequestHelper.addFakeSignedTransactionString(req);
        RequestHelper.addFakeBlockchainIdForOrganization(req);

        const res = await req;

        ResponseHelper.expectStatusCreated(res);

        const lastOrg = await OrganizationsRepository.findLastByAuthor(userPetr.id);

        expect(lastOrg.id).toBe(res.body.id);
        expect(lastOrg.id).not.toBe(100500);
        expect(lastOrg.user_id).not.toBe(userVlad.id);
      });

      it('should throw an error if NOT unique fields is provided', async () => {
        const user = userVlad;

        await OrganizationsGenerator.createOrgWithoutTeam(userVlad);
        const existingOrg = await OrganizationsRepository.findFirstByAuthor(user.id);

        const twoFieldsReq = request(server)
          .post(RequestHelper.getOrganizationsUrl())
          .set('Authorization', `Bearer ${user.token}`)
          .field('title', 'somehow new title')
          .field('email', existingOrg.email)
          .field('nickname', existingOrg.nickname)
        ;

        RequestHelper.addFakeSignedTransactionString(twoFieldsReq);
        RequestHelper.addFakeBlockchainIdForOrganization(twoFieldsReq);

        const twoFieldsRes = await twoFieldsReq;

        ResponseHelper.expectStatusBadRequest(twoFieldsRes);

        const { errors } = twoFieldsRes.body;
        expect(errors).toBeDefined();
        expect(errors.length).toBe(2);

        expect(errors.some((error) => error.field === 'nickname')).toBeTruthy();
        expect(errors.some((error) => error.field === 'email')).toBeTruthy();

        const oneFieldReq = request(server)
          .post(RequestHelper.getOrganizationsUrl())
          .set('Authorization', `Bearer ${user.token}`)
          .field('title', 'somehow new title')
          .field('email', 'unique_email@gmail.com')
          .field('nickname', existingOrg.nickname)
        ;

        RequestHelper.addFakeSignedTransactionString(oneFieldReq);
        RequestHelper.addFakeBlockchainIdForOrganization(oneFieldReq);

        const oneFieldRes = await oneFieldReq;

        ResponseHelper.expectStatusBadRequest(oneFieldRes);

        const oneFieldErrors = oneFieldRes.body.errors;
        expect(oneFieldErrors).toBeDefined();
        expect(oneFieldErrors.length).toBe(1);

        expect(oneFieldErrors.some((error) => error.field === 'nickname')).toBeTruthy();
        expect(oneFieldErrors.some((error) => error.field === 'email')).toBeFalsy();
      }, JEST_TIMEOUT * 3);
    });
  });

  describe('Update organization', () => {
    describe('Positive scenarios', () => {
      it('should be possible to update social networks of organization', async () => {
        const user = userVlad;

        await OrganizationsGenerator.createOrgWithoutTeam(user);

        const orgId = await OrganizationsRepository.findFirstIdByAuthorId(user.id);
        await OrganizationsHelper.createSocialNetworksDirectly(orgId);

        const sources =
          await EntitySourcesRepository.findAllByEntity(orgId, OrganizationsModelProvider.getEntityName());

        const sourcesForRequest: any = [];

        let sourceToDelete;
        let sourceToModify;
        sources.forEach((source) => {
          if (!sourceToDelete) {
            sourceToDelete = source;
          } else if (!sourceToModify) {
            sourceToModify = source;
          } else {
            sourcesForRequest.push(source);
          }
        });

        const sourceUrlToChange = faker.internet.url();

        // noinspection JSUnusedAssignment
        sourceToModify.source_url = sourceUrlToChange;
        // noinspection JSUnusedAssignment
        sourceToModify.entity_id = 2; // should not be updated

        // noinspection JSUnusedAssignment
        sourcesForRequest.push(sourceToModify);

        const newSource = {
          source_url:     faker.internet.url(),
          source_type_id: 4, // from Dict - social networks
          entity_id:      orgId,
          entity_name:    OrganizationsModelProvider.getEntityName(),
        };

        sourcesForRequest.push(newSource);

        const fieldsToUpdate = {
          title:      'Fake title',
          nickname:   'Fake_nickname',
          powered_by: 'YOC',
        };

        await OrganizationsHelper.requestToUpdateExisting(
          orgId,
          user,
          fieldsToUpdate,
          [],
          sourcesForRequest,
        );

        const orgAfter = await OrganizationsHelper.requestToGetOneOrganizationAsGuest(orgId);

        // Check that regular fields are updated
        ResponseHelper.expectValuesAreExpected(fieldsToUpdate, orgAfter);

        const socialNetworksAfter = orgAfter.social_networks;

        expect(socialNetworksAfter.length).toBe(sources.length);

        expect(socialNetworksAfter.some((source) => source.id === sourceToDelete.id)).toBeFalsy();

        const modifiedSource = socialNetworksAfter.find((source) => source.id === sourceToModify.id);
        expect(modifiedSource).toBeDefined();

        // sourceToModify.source_url = faker.internet.url();
        // sourceToModify.is_official = true;
        // sourceToModify.entity_id = 2; // should not be updated

        // expect that value is changed
        // noinspection JSUnusedAssignment
        ResponseHelper.expectValuesAreExpected({
          // should be changed
          source_url:   sourceUrlToChange,

          // should not be changed because no request to change
          is_official:  sourceToModify.is_official,
          entity_id:    `${orgId}`, // should not be changed because of restrictions
        },                                  modifiedSource);
      }, JEST_TIMEOUT * 3);

      // tslint:disable-next-line:max-line-length
      it.skip('If ID of different entity is provided - new one will be created and id will be ignored', async () => {
      });

      // tslint:disable-next-line:max-line-length
      it.skip('should not be possible to update sensitive social networks data by request', async () => {
      });

      it('should be possible to update organization with users team updating', async () => {
        const user = userVlad;
        const orgId = await OrganizationsGenerator.createOrgWithTeam(user, [userPetr]);
        const orgBefore = await OrganizationsRepository.findOneById(orgId, 0);

        const userPetrBefore = orgBefore.users_team.find((data) => data.user_id === userPetr.id);

        const avatarFilenameBefore = orgBefore.avatar_filename;

        const sampleOrganizationFields = OrganizationsHelper.getSampleOrganizationsParams();
        sampleOrganizationFields.title = 'New title which is changed';

        // remove Jane, add Rokky and preserve Petr
        const newUsersTeam = [
          {
            user_id: userPetr.id,
          },
          {
            user_id: userRokky.id,
          },
          {
            user_id: user.id, // try to add author to the board - should be ignored
          },
        ];

        await OrganizationsHelper.requestToUpdateOrganization(
          orgBefore.id,
          user,
          sampleOrganizationFields,
          newUsersTeam,
        );

        const orgAfter = await OrganizationsRepository.findOneById(orgId, 0);
        const avatarFilenameAfter = orgAfter.avatar_filename;

        delete sampleOrganizationFields.avatar_filename;

        ResponseHelper.expectValuesAreExpected(sampleOrganizationFields, orgAfter);

        expect(avatarFilenameAfter).not.toBe(avatarFilenameBefore);
        await OrganizationsHelper.isAvatarImageUploaded(avatarFilenameAfter);

        const usersTeam = orgAfter.users_team;
        expect(usersTeam).toBeDefined();

        expect(usersTeam.some((data) => data.user_id === userJane.id)).toBeFalsy();
        expect(usersTeam.some((data) => data.user_id === userRokky.id)).toBeTruthy();

        const userPetrAfter = usersTeam.find((data) => data.user_id === userPetr.id);

        expect(userPetrAfter).toMatchObject(userPetrBefore);

        expect(usersTeam.some((data) => data.user_id === userVlad.id)).toBeFalsy();
      });

      it.skip('should be possible to remove all board by clearing it', async () => {
      });

      it('should sanitize org updating input', async () => {
        const user = userVlad;
        const orgId = await OrganizationsGenerator.createOrgWithoutTeam(user);

        const injection = '<script>alert("Hello");</script><img src="https://hacked.url"/>';

        const newModelFields = {
          title: 'expectedTitle',
          nickname: 'expectedNickname',
          powered_by: 'PAI',
          about: 'expectedAbout',
          country: 'Russia',
        };

        const infectedFields: any = {};
        for (const field in newModelFields) {
          if (!newModelFields.hasOwnProperty(field)) {
            continue;
          }

          infectedFields[field] = newModelFields[field] + injection;
        }

        const req = request(server)
          .patch(RequestHelper.getOneOrganizationUrl(orgId))
          .set('Authorization', `Bearer ${user.token}`)
          .field('title',       infectedFields.title)
          .field('nickname',    infectedFields.nickname)
          .field('powered_by',  infectedFields.powered_by)
          .field('about',       infectedFields.about)
          .field('country',     infectedFields.country)
        ;

        RequestHelper.addFakeSignedTransactionString(req);
        RequestHelper.addFakeBlockchainIdForOrganization(req);

        const res = await req;

        ResponseHelper.expectStatusOk(res);

        const lastModel = await OrganizationsRepository.findOneById(orgId);

        ResponseHelper.expectValuesAreExpected(newModelFields, lastModel);
      });

      // tslint:disable-next-line:max-line-length
      it('should be possible to update organization itself without changing unique fields - no unique error', async () => {
        const user = userVlad;
        const orgId = await OrganizationsGenerator.createOrgWithoutTeam(user);

        const org = await OrganizationsRepository.findOneById(orgId);

        const newModelFields = {
          title:    org.title,
          nickname: org.nickname,
          email:    org.email,
          about:    'expectedAbout',
        };

        const req = request(server)
          .patch(RequestHelper.getOneOrganizationUrl(orgId))
          .set('Authorization', `Bearer ${user.token}`)
          .field('title',       newModelFields.title)
          .field('nickname',    newModelFields.nickname)
          .field('email',       newModelFields.email)
          .field('about',       newModelFields.about)
        ;

        RequestHelper.addFakeSignedTransactionString(req);
        RequestHelper.addFakeBlockchainIdForOrganization(req);

        const res = await req;

        ResponseHelper.expectStatusOk(res);

        const lastModel = await OrganizationsRepository.findOneById(orgId);

        ResponseHelper.expectValuesAreExpected(newModelFields, lastModel);
      });

      it('should be possible to update organization with random extra fields', async () => {
        // Required because frontend will send fields which are not been implemented in backend
        const user = userJane;
        await OrganizationsGenerator.createOrgWithoutTeam(user);
        const orgBefore = await OrganizationsRepository.findLastByAuthor(user.id);
        const orgId = orgBefore.id;

        const fieldsToChange = {
          title: 'Changed title from extremely to',
          nickname: 'changed_nickname',
        };

        const extraFields = {
          random_field_one: 'random_field_one_value',
          random_field_two: 'random_field_two_value',
        };

        const req = request(server)
          .patch(RequestHelper.getOneOrganizationUrl(orgId))
          .set('Authorization', `Bearer ${user.token}`)
          .field('title', fieldsToChange.title)
          .field('nickname', fieldsToChange.nickname)
          .field('random_field_one', extraFields.random_field_one)
          .field('random_field_two', extraFields.random_field_two)
        ;

        RequestHelper.addFakeSignedTransactionString(req);
        RequestHelper.addFakeBlockchainIdForOrganization(req);

        const res = await req;

        ResponseHelper.expectStatusOk(res);

        const orgAfter = await OrganizationsRepository.findOneById(orgId);

        ResponseHelper.expectValuesAreExpected(fieldsToChange, orgAfter);

        expect(orgAfter.random_field_one).not.toBeDefined();
        expect(orgAfter.random_field_two).not.toBeDefined();
      });
    });
    describe('Negative scenarios', () => {
      it('should not be possible to update organizations by user who is not author', async () => {
        const orgId = await OrganizationsGenerator.createOrgWithoutTeam(userVlad);

        const res = await request(server)
          .patch(RequestHelper.getOneOrganizationUrl(orgId))
          .set('Authorization', `Bearer ${userRokky.token}`)
          .field('title',       'sample_title100500')
          .field('nickname',    'sample_nickname100500')
        ;

        expect(res.status).toBe(401);
      });

      it('should not be possible to change avatar filename without attaching a file', async () => {
        const orgId = await OrganizationsGenerator.createOrgWithoutTeam(userVlad);

        const orgBefore = await OrganizationsRepository.findOneById(orgId);

        const req = request(server)
          .patch(RequestHelper.getOneOrganizationUrl(orgId))
          .set('Authorization', `Bearer ${userVlad.token}`)
          .field('title',       'sample_title100500')
          .field('nickname',    'sample_nickname100500')
          .field('avatar_filename', 'avatar_is_changed.jpg')
        ;

        RequestHelper.addFakeSignedTransactionString(req);
        RequestHelper.addFakeBlockchainIdForOrganization(req);

        const res = await req;

        ResponseHelper.expectStatusOk(res);

        const orgAfter = await OrganizationsRepository.findOneById(orgId);

        expect(orgAfter.avatar_filename).toBe(orgBefore.avatar_filename);
        expect(orgAfter.avatar_filename).not.toBe('avatar_is_changed.jpg');
      });

      it('should not be possible to update org using malformed organization ID', async () => {
        const currentOrgId = 'malformed';

        // noinspection JSCheckFunctionSignatures
        const res = await request(server)
          .patch(RequestHelper.getOneOrganizationUrl(currentOrgId))
          .set('Authorization', `Bearer ${userVlad.token}`)
          .field('title',     'new_title')
          .field('nickname',  'new_nickname')
        ;

        ResponseHelper.expectStatusBadRequest(res);
      });

      it('should not be possible to update org using not existed organization ID', async () => {
        const currentOrgId = 100500;

        const res = await request(server)
          .patch(RequestHelper.getOneOrganizationUrl(currentOrgId))
          .set('Authorization', `Bearer ${userVlad.token}`)
          .field('title',     'new_title')
          .field('nickname',  'new_nickname')
        ;

        ResponseHelper.expectStatusNotFound(res);
      });

      // tslint:disable-next-line:max-line-length
      it('should be two errors if one org has given email, and other has given nickname', async () => {
        const currentOrgId = await OrganizationsGenerator.createOrgWithoutTeam(userVlad);
        const orgIdToTakeEmail = await OrganizationsGenerator.createOrgWithoutTeam(userJane);
        const orgIdToTakeNickname = await OrganizationsGenerator.createOrgWithoutTeam(userPetr);

        const [currentOrg, orgToTakeEmail, orgToTakeNickname] = await Promise.all([
          OrganizationsRepository.findOneById(currentOrgId),
          OrganizationsRepository.findOneById(orgIdToTakeEmail),
          OrganizationsRepository.findOneById(orgIdToTakeNickname),
        ]);

        const newModelFields = {
          title:    currentOrg.title,
          email:    orgToTakeEmail.email,
          nickname: orgToTakeNickname.nickname,
        };

        const res = await request(server)
          .patch(RequestHelper.getOneOrganizationUrl(currentOrgId))
          .set('Authorization', `Bearer ${userVlad.token}`)
          .field('title',     newModelFields.title)
          .field('email',     newModelFields.email)
          .field('nickname',  newModelFields.nickname)
        ;

        ResponseHelper.expectStatusBadRequest(res);
        const { errors } = res.body;

        expect(errors.length).toBe(2);

        expect(errors).toBeDefined();
        expect(errors.some((error) => error.field === 'email')).toBeTruthy();
        expect(errors.some((error) => error.field === 'nickname')).toBeTruthy();
      }, JEST_TIMEOUT * 3);

      // tslint:disable-next-line:max-line-length
      it('should not be possible to update with given nickname, if email is same as given org but nickname is same as in other org', async () => {
        const currentOrgId = await OrganizationsGenerator.createOrgWithoutTeam(userVlad);
        const otherOrgId = await OrganizationsGenerator.createOrgWithoutTeam(userJane);

        const [currentOrg, otherOrg] = await Promise.all([
          OrganizationsRepository.findOneById(currentOrgId),
          OrganizationsRepository.findOneById(otherOrgId),
        ]);

        const newModelFields = {
          title:    currentOrg.title,
          email:    currentOrg.email,
          nickname: otherOrg.nickname,
        };

        const res = await request(server)
          .patch(RequestHelper.getOneOrganizationUrl(currentOrgId))
          .set('Authorization', `Bearer ${userVlad.token}`)
          .field('title', newModelFields.title)
          .field('email', newModelFields.email)
          .field('nickname', newModelFields.nickname)
        ;

        ResponseHelper.expectStatusBadRequest(res);
        const { errors } = res.body;
        expect(errors.length).toBe(1);

        expect(errors).toBeDefined();
        expect(errors.some((error) => error.field === 'email')).toBeFalsy();
        expect(errors.some((error) => error.field === 'nickname')).toBeTruthy();
      }, JEST_TIMEOUT * 3);

      it('should not be possible to update org without auth token', async () => {
        const orgId = await OrganizationsGenerator.createOrgWithoutTeam(userVlad);

        const res = await request(server)
          .patch(RequestHelper.getOneOrganizationUrl(orgId))
          .field('title',  'Sample title to change')
        ;

        ResponseHelper.expectStatusUnauthorized(res);
      }, JEST_TIMEOUT * 3);

      it.skip('should throw correct error messages related to invalid fields', async () => {
      });
    });
  });
});

export {};
