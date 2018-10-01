const request = require('supertest');
const server = require('../../../app');
const RequestHelper = require('./request-helper');
const ResponseHelper = require('./response-helper');
const FileToUploadHelper = require('./file-to-upload-helper');

const { orgImageStoragePath } = require('../../../lib/organizations/middleware/organization-create-edit-middleware');

const OrganizationsRepositories = require('../../../lib/organizations/repository');
const UserActivityService = require('../../../lib/users/user-activity-service');
const OrganizationService = require('../../../lib/organizations/service/organization-service');
const EntitySourcesRepository = require('../../../lib/entities/repository').Sources;
const OrgModelProvider = require('../../../lib/organizations/service/organizations-model-provider');

require('jest-expect-message');
class OrganizationsHelper {


  /**
   *
   * @param {string} query
   * @return {Promise<Object>}
   */
  static async requestToSearchCommunity(query) {
    const res = await request(server)
      .get(RequestHelper.getCommunitySearchUrl(query))
    ;

    ResponseHelper.expectStatusOk(res);

    return res.body;
  }

  /**
   * @param {number} organizationId
   * @return {Promise<Object>}
   */
  static async createSocialNetworksDirectly(organizationId) {
    const entityName = OrgModelProvider.getEntityName();

    const entities = [
      {
        source_url: 'https://myurl.com',
        source_type_id: 1, // from Dict - social networks
        source_group_id: 1, // TODO from dict
        entity_id: organizationId,
        entity_name: entityName,
      },
      {
        source_url: 'http://mysourceurl2.com',
        source_type_id: 2,
        source_group_id: 1, // TODO from dict
        entity_id: organizationId,
        entity_name: entityName,
      },
      {
        source_url: 'http://mysourceurl3.com',
        source_type_id: 3,
        source_group_id: 1, // TODO from dict
        entity_id: organizationId,
        entity_name: entityName,
      }
    ];

    return await EntitySourcesRepository.bulkCreate(entities);
  }

  /**
   *
   * @param {number} orgId
   * @param {number} expectedStatus
   * @return {Promise<void>}
   */
  static async requestToGetOrgPosts(orgId, expectedStatus = 200) {
    const res = await request(server)
      .get(RequestHelper.getOrganizationsPostsUrl(orgId))
    ;
    ResponseHelper.expectStatusToBe(res, expectedStatus);

    return res.body;
  }

  static mockBlockchainPart() {
    // noinspection JSUnusedLocalSymbols
    UserActivityService._sendPayloadToRabbit = function (activity, scope) {
      console.log('SEND TO RABBIT MOCK IS CALLED');
    };

    OrganizationService._addSignedTransactionsForOrganizationCreation = async function (req) {
      console.log('MOCK add signed transaction is called');

      req.blockchain_id = 'sample_blockchain_id';
      req.signed_transaction = 'sample_signed_transaction';
    };
  }

  /**
   *
   * @param {string} filename
   */
  static async isAvatarImageUploaded(filename) {
    await FileToUploadHelper.isFileUploadedToPath(filename, orgImageStoragePath);
  }

  /**
   *
   * @param {Object[]}models
   */
  static checkOrganizationsPreviewFields(models) {
    models.forEach(model => {
      this.checkOneOrganizationPreviewFields(model);
    })
  }

  /**
   *
   * @param {Object} model - model with included user
   * @param {string[]|null} givenExpected - model with included user
   */
  static checkOneOrganizationPreviewFields(model, givenExpected = null) {
    const expected = givenExpected ? givenExpected : OrganizationsRepositories.Main.getFieldsForPreview();

    ResponseHelper.expectAllFieldsExistence(model, expected);
  }

  /**
   *
   * @param {string | null } queryString
   * @returns {Promise<Object[]>}
   */
  static async requestToGetOrganizationsAsGuest(queryString = null) {

    let url = RequestHelper.getOrganizationsUrl();

    if (queryString) {
      url+= '?' + queryString;
    }

    const res = await request(server)
      .get(url)
    ;

    ResponseHelper.expectStatusOk(res);

    return res.body.data;
  }

  /**
   *
   * @param {number} model_id
   * @return {Promise<Object>}
   */
  static async requestToGetOneOrganizationAsGuest(model_id) {
    const url = RequestHelper.getOneOrganizationUrl(model_id);

    const res = await request(server)
      .get(url)
    ;

    ResponseHelper.expectStatusOk(res);

    return res.body.data;
  }

  // noinspection JSUnusedGlobalSymbols
  /**
   *
   * @param {Object[]}models
   */
  static checkIncludedOrganizationPreviewForArray(models) {
    models.forEach(model => {
      this.checkIncludedOrganizationPreview(model);
    })
  }

  /**
   *
   * @param {Object} model
   * @param {string[]}givenExpected
   */
  static checkIncludedOrganizationPreview(model, givenExpected = null) {
    const targetModels = model.organizations;

    expect(targetModels).toBeDefined();

    const expected = givenExpected ? givenExpected : OrganizationsRepositories.Main.getOrganizationModel().getFieldsForPreview().sort();

    targetModels.forEach(model => {
      ResponseHelper.expectAllFieldsExistence(model, expected);
    });
  }

  /**
   *
   * @param {Object} user - myself
   * @param {number} model_id
   * @return {Promise<Object>}
   */
  static async requestToGetOneOrganizationAsMyself(user, model_id) {
    const url = RequestHelper.getOneOrganizationUrl(model_id);

    const res = await request(server)
      .get(url)
      .set('Authorization', `Bearer ${user.token}`)
    ;

    ResponseHelper.expectStatusOk(res);

    return res.body.data;
  }

  /**
   *
   * @return {Object}
   */
  static getSampleOrganizationsParams() {
    return {
      'title': 'Extremely new org',
      'currency_to_show': 'CPX',
      'powered_by': 'CPX',
      'about': 'Extremely cool new about org',
      'nickname': 'extreme_nick',
      'email': 'extremeemail@gmail.com',
      'phone_number': '+19999999',
      'country': 'USA',
      'city': 'LA',
      'address': 'La alley, 18',
      'personal_website_url': 'https://extreme.com',
      'avatar_filename': FileToUploadHelper.getSampleFilePathToUpload(),
    }
  }

  // noinspection JSUnusedGlobalSymbols
  /**
   *
   * @param {Object} user
   * @return {Promise<Object>}
   */
  static async requestToCreateOrgWithMinimumFields(user) {
    const res = await request(server)
      .post(RequestHelper.getOrganizationsUrl())
      .set('Authorization', `Bearer ${user.token}`)
      .field('title', 'Title12345')
      .field('nickname', '123nickname123')
    ;

    ResponseHelper.expectStatusCreated(res);

    return res.body;
  }

  /**
   *
   * @param {number} org_id
   * @param {Object} user
   * @param {Object} newModelFields
   * @param {Object[]} usersTeam
   * @return {Promise<Object>}
   */
  static async requestToUpdateOrganization(org_id, user, newModelFields, usersTeam) {

    const res = await request(server)
      .patch(RequestHelper.getOneOrganizationUrl(org_id))
      .set('Authorization', `Bearer ${user.token}`)
      .field('title', newModelFields.title)
      .field('currency_to_show', newModelFields.currency_to_show)
      .field('powered_by', newModelFields.powered_by)
      .field('about', newModelFields.about)
      .field('nickname', newModelFields.nickname)
      .field('email', newModelFields.email)
      .field('phone_number', newModelFields.phone_number)
      .field('country', newModelFields.country)
      .field('city', newModelFields.city)
      .field('address', newModelFields.address)
      .field('personal_website_url', newModelFields.personal_website_url)

      .field('users_team[0][id]', usersTeam[0]['user_id'])
      .field('users_team[1][id]', usersTeam[1]['user_id'])
      .field('users_team[2][id]', usersTeam[2]['user_id'])

      .attach('avatar_filename', newModelFields.avatar_filename)
    ;

    ResponseHelper.expectStatusOk(res);

    return res.body;
  }

  /**
   *
   * @param {Object} user
   * @param {Object} fields
   * @param {Object[]} socialNetworks
   * @param {number} expectedStatus
   * @return {Promise<Object>}
   */
  static async requestToCreateNew(user, fields, socialNetworks = [], expectedStatus = 201) {
    const req = request(server)
      .post(RequestHelper.getOrganizationsUrl())
      .set('Authorization', `Bearer ${user.token}`)
    ;

    for (const field in fields) {
      req.field(field, fields[field]);
    }

    socialNetworks.forEach((source, i) => {
      for (const field in source) {
        // noinspection JSUnfilteredForInLoop
        const fieldName = `social_networks[${i}][${field}]`;
        // noinspection JSUnfilteredForInLoop
        req.field(fieldName, source[field])
      }
    });

    const res = await req;
    ResponseHelper.expectStatusToBe(res, expectedStatus);

    return res.body;
  }

  /**
   *
   * @param {number} orgId
   * @param {Object} user
   * @param {Object} fields
   * @param {Object[]} socialNetworks
   * @param {number} expectedStatus
   * @return {Promise<Object>}
   */
  static async requestToUpdateExisting(orgId, user, fields, socialNetworks = [], expectedStatus = 200) {
    const req = request(server)
      .patch(RequestHelper.getOneOrganizationUrl(orgId))
      .set('Authorization', `Bearer ${user.token}`)
    ;

    for (const field in fields) {
      req.field(field, fields[field]);
    }

    socialNetworks.forEach((source, i) => {
      for (const field in source) {
        if (source[field] === null) {
          continue;
        }

        if (field === 'created_at' || field === 'updated_at') {
          continue;
        }

        // noinspection JSUnfilteredForInLoop
        const fieldName = `social_networks[${i}][${field}]`;
        // noinspection JSUnfilteredForInLoop
        req.field(fieldName, source[field])
      }
    });

    const res = await req;
    ResponseHelper.expectStatusToBe(res, expectedStatus);

    return res.body;
  }

  /**
   * @deprecated
   * @see requestToCreateNew
   * @param {Object} user
   * @param {Object} requiredFields
   * @return {Promise<Object>}
   */
  static async requestToCreateNewOrganization(user, requiredFields = null) {
    let newModelFields;

    if (requiredFields) {
      newModelFields = requiredFields;
    } else {
      newModelFields = this.getSampleOrganizationsParams();
    }

    const res = await request(server)
      .post(RequestHelper.getOrganizationsUrl())
      .set('Authorization', `Bearer ${user.token}`)
      .field('title', newModelFields.title)
      .field('currency_to_show', newModelFields.currency_to_show)
      .field('powered_by', newModelFields.powered_by)
      .field('about', newModelFields.about)
      .field('nickname', newModelFields.nickname)
      .field('email', newModelFields.email)
      .field('phone_number', newModelFields.phone_number)
      .field('country', newModelFields.country)
      .field('city', newModelFields.city)
      .field('address', newModelFields.address)
      .field('personal_website_url', newModelFields.personal_website_url)
      .field('users_team[]', '') // this is to catch and fix bug by TDD
      .attach('avatar_filename', newModelFields.avatar_filename)
    ;

    ResponseHelper.expectStatusCreated(res);

    return res.body;
  }
}

module.exports = OrganizationsHelper;