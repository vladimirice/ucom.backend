const request = require('supertest');
const server = require('../../../app');
const RequestHelper = require('./request-helper');
const ResponseHelper = require('./response-helper');
const FileToUploadHelper = require('./file-to-upload-helper');
const _ = require('lodash');
const faker = require('faker');

const { orgImageStoragePath } = require('../../../lib/organizations/middleware/organization-create-edit-middleware');

const OrganizationsRepositories = require('../../../lib/organizations/repository');
const UserActivityService = require('../../../lib/users/user-activity-service');
const OrganizationService = require('../../../lib/organizations/service/organization-service');
const EntitySourcesRepository = require('../../../lib/entities/repository').Sources;
const OrgModelProvider = require('../../../lib/organizations/service/organizations-model-provider');
const EntityModelProvider = require('../../../lib/entities/service/entity-model-provider');
const UserToOrgActivity = require('../../../lib/users/activity/user-to-organization-activity');

require('jest-expect-message');
class OrganizationsHelper {

  /**
   *
   * @param {number} orgId
   * @param {Object} user
   * @param {number} expectedStatus
   * @return {Promise<Object>}
   */
  static async requestToFollowOrganization(orgId, user, expectedStatus = 201) {
    const res = await request(server)
      .post(RequestHelper.getOrgFollowUrl(orgId))
      .set('Authorization', `Bearer ${user.token}`)
    ;

    ResponseHelper.expectStatusToBe(res, expectedStatus);

    return res.body;
  }

  /**
   *
   * @param {number} org_id
   * @param {Object} user
   * @param {number} expectedStatus
   * @return {Promise<Object>}
   */
  static async requestToUnfollowOrganization(org_id, user, expectedStatus = 201) {
    const res = await request(server)
      .post(RequestHelper.getOrgUnfollowUrl(org_id))
      .set('Authorization', `Bearer ${user.token}`)
    ;

    ResponseHelper.expectStatusToBe(res, expectedStatus);

    return res.body;
  }

  static async requestToCreateOrgFollowHistory(whoActs, targetOrgId) {
    await this.requestToFollowOrganization(targetOrgId, whoActs);
    await this.requestToUnfollowOrganization(targetOrgId, whoActs);
    await this.requestToFollowOrganization(targetOrgId, whoActs);
  }

  static async requestToCreateOrgUnfollowHistory(whoActs, targetOrgId) {
    await this.requestToFollowOrganization(targetOrgId, whoActs);
    await this.requestToUnfollowOrganization(targetOrgId, whoActs);
    await this.requestToFollowOrganization(targetOrgId, whoActs);
    await this.requestToUnfollowOrganization(targetOrgId, whoActs)
  }

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
    expect(_.isArray(res.body)).toBeTruthy();

    return res.body;
  }

  /**
   *
   * @param {string} query
   * @return {Promise<Object>}
   */
  static async requestToSearchPartnership(query) {
    const res = await request(server)
      .get(RequestHelper.getPartnershipSearchUrl(query))
    ;
    ResponseHelper.expectStatusOk(res);

    expect(_.isArray(res.body)).toBeTruthy();

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

    // noinspection JSUnusedLocalSymbols
    UserToOrgActivity._addSignedTransactionsForOrganizationFollowing = async function (body, currentUser, activityTypeId) {
      console.log('MOCK add signed transaction is called');
      body.signed_transaction = 'sample_signed_transaction';
    }
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
    expect(model).toBeDefined();
    expect(model).not.toBeNull();
    const expected = givenExpected ? givenExpected : OrganizationsRepositories.Main.getFieldsForPreview();

    if (model.avatar_filename) {
      expect(model.avatar_filename, 'It seems that org post processing is not called').toMatch('organizations/');
      expect(model.avatar_filename, 'It seems that org post processing is called more than once').not.toMatch('/organizations/');
    }

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

  static async checkSourcesAfterUpdating(sourceAfter, sourceSet) {
    expect(sourceAfter.some(data => data.id === sourceSet.internal.to_delete.id)).toBeFalsy();
    expect(sourceAfter.some(data => data.id === sourceSet.external.to_delete.id)).toBeFalsy();

    sourceSet.internal.to_check.forEach(source => {
      const existed = sourceAfter.find(data => data.id === source.id);
      expect(existed).toBeDefined();

      expect(existed).toEqual(source);
    });

    sourceSet.external.to_check.forEach(source => {
      const existed = sourceAfter.find(data => data.id === source.id);
      expect(existed).toBeDefined();

      expect(existed).toEqual(source);
    });

    // adding
    const expectedAdded = sourceSet.internal.to_add;
    const actualAdded = sourceAfter.find(data => +data.entity_id === +expectedAdded.entity_id);
    expect(actualAdded).toBeDefined();
    expect(actualAdded).toMatchObject(expectedAdded);

    const expectedAddedExternal = sourceSet.external.to_add;
    const actualAddedExternal = sourceAfter.find(data => data.source_url === expectedAddedExternal.source_url && data.source_type === 'external');
    expect(actualAddedExternal).toBeDefined();

    await FileToUploadHelper.isFileUploaded(actualAddedExternal.avatar_filename);
    delete expectedAddedExternal.avatar_filename;

    expect(actualAddedExternal).toMatchObject(expectedAddedExternal);
  }

  static prepareSourceForUpdating(orgId, sources) {
    let internalSources = [];
    let externalSources = [];

    sources.forEach(source => {
      if (source.source_type === 'internal') {
        internalSources.push(source)
      } else {
        externalSources.push(source);
      }
    });

    let internalSourceToDelete = internalSources[0];
    let internalSourceToAdd = {
      entity_id:    "3", // entity to link on
      entity_name:  OrgModelProvider.getEntityName(), // entity to link on

      source_type:  'internal',
    };

    const internalSourcesForRequest = [
      internalSources[1],
      internalSources[2],
      internalSourceToAdd,
    ];

    let externalSourceToDelete = externalSources[0];
    let externalSourceToAdd = {
      source_url:       'https://coolpartnershipnewnew.com',

      title:            'External super community',
      description:      'This is a cool description about cool external community',

      source_type:      'external',
      avatar_filename:  FileToUploadHelper.getSampleFilePathToUpload(),
    };

    // External source should be changed
    externalSources[1].source_url = 'http://example_to_changed.com';
    // TODO - change avatar filename also

    const externalSourcesForRequest = [
      externalSources[1],
      externalSources[2],
      externalSourceToAdd,
    ];

    return {
      for_request: _.concat(internalSourcesForRequest, externalSourcesForRequest),

      internal: {
        'to_add':     internalSourceToAdd,
        'to_delete':  internalSourceToDelete,
        'to_check': [
          internalSources[1],
          internalSources[2],
        ],
      },

      external: {
        'to_add':     externalSourceToAdd,
        'to_delete':  externalSourceToDelete,
        'to_check': [
          externalSources[1],
          externalSources[2],
        ],
      }
    };
  }

  /**
   *
   * @param {number} org_id
   * @return {Promise<void>}
   */
  static async createSampleSourcesForOrganization(org_id) {
    const sourceGroupIdCommunity = 2;

    const addToEverySource = {
      entity_id:    org_id,
      entity_name:  OrgModelProvider.getEntityName(),

      source_type_id: null,
      is_official: false
    };

    const toInsert = [
      // community-internal
      {
        source_entity_id: 1,
        source_entity_name: OrgModelProvider.getEntityName(),

        source_url: '',
        text_data: '',
        source_group_id: sourceGroupIdCommunity,
        ...addToEverySource
      },
      {
        source_entity_id: 2,
        source_entity_name: OrgModelProvider.getEntityName(),

        source_url: '',
        text_data: '',
        source_group_id: sourceGroupIdCommunity,
        ...addToEverySource
      },
      {
        source_entity_id: 3,
        source_entity_name: OrgModelProvider.getEntityName(),

        source_url: '',
        text_data: '',
        source_group_id: sourceGroupIdCommunity,
        ...addToEverySource
      },

      // community-external
      {
        source_url: 'https://coolcommunity_external_1.com',
        text_data: '{"title":"External super community 1","description":"This is a cool description about cool external community 1"}',

        source_entity_id: null,
        source_entity_name: null,
        source_group_id: sourceGroupIdCommunity,
        avatar_filename: 'sample_community_external_1.png',
        ...addToEverySource
      },
      {
        source_url: 'https://coolcommunity_external_2.com',
        text_data: '{"title":"External super community 2","description":"This is a cool description about cool external community 2"}',

        source_entity_id: null,
        source_entity_name: null,
        source_group_id: sourceGroupIdCommunity,
        avatar_filename: 'sample_community_external_2.png',
        ...addToEverySource
      },
      {
        source_url: 'https://coolcommunity_external_3.com',
        text_data: '{"title":"External super community 3","description":"This is a cool description about cool external community 3"}',

        source_entity_id: null,
        source_entity_name: null,
        source_group_id: sourceGroupIdCommunity,
        avatar_filename: 'sample_community_external_3.png',
        ...addToEverySource
      },

      ///////// Partnership-internal
      {
        source_url: '',
        is_official: false,
        source_type_id: null,
        source_group_id: 3,
        entity_id: org_id,
        entity_name: 'org       ',

        source_entity_id: 2,
        source_entity_name: 'org       ',
        text_data: '',
      },
      {
        source_url: '',
        is_official: false,
        source_type_id: null,
        source_group_id: 3,
        entity_id: org_id,
        entity_name: 'org       ',

        source_entity_id: 3,
        source_entity_name: 'org       ',
        text_data: '',
      },
      {
        source_url: '',
        is_official: false,
        source_type_id: null,
        source_group_id: 3,
        entity_id: org_id,
        entity_name: 'org       ',

        source_entity_id: 1,
        source_entity_name: 'users     ',
        text_data: '',
      },

      ///////// Partnership-external
      {
        source_url: 'https://coolpartnership.com',
        is_official: false,
        source_type_id: null,
        source_group_id: 3,
        entity_id: org_id,
        entity_name: 'org       ',

        avatar_filename: 'sample_partnership_external_1.png',
        source_entity_id: null,
        source_entity_name: null,
        text_data: '{"title":"External super partnership","description":"This is a cool description about cool external partnership"}',
      },
      {
        source_url: 'https://coolpartnership12345.com',
        is_official: false,
        source_type_id: null,
        source_group_id: 3,
        entity_id: org_id,
        entity_name: 'org       ',

        source_entity_id: null,
        source_entity_name: null,
        avatar_filename: 'sample_partnership_external_2.png',
        text_data: '{"title":"External super partnership12345","description":"This is a cool description about cool external partnership"}',
      },
      {
        source_url: 'https://coolpartnership12345789.com',
        is_official: false,
        source_type_id: null,
        source_group_id: 3,
        entity_id: org_id,
        entity_name: 'org       ',

        source_entity_id: null,
        source_entity_name: null,
        avatar_filename: 'sample_partnership_external_3.png',
        text_data: '{"title":"External super partnership12345789","description":"This is a cool description about cool external partnership"}',
      },
    ];

    await EntityModelProvider.getSourcesModel().bulkCreate(toInsert);
  }

  /**
   *
   * @param {number} orgId
   * @return {Promise<Object>}
   */
  static async requestToGetOneOrganizationAsGuest(orgId) {
    const url = RequestHelper.getOneOrganizationUrl(orgId);

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
   * @param {number} orgId
   * @return {Promise<Object>}
   */
  static async requestToGetOneOrganizationAsMyself(user, orgId) {
    const url = RequestHelper.getOneOrganizationUrl(orgId);

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
   * @return {{title: *, nickname: *}}
   * @private
   */
  static _getMinimumFieldsSet() {
    return {
      'title':    faker.name.firstName(),
      'nickname': faker.lorem.word(),
    };
  }

  // noinspection FunctionWithMultipleLoopsJS
  /**
   *
   * @param {Object} user
   * @param {Object} fields - regular organization fields
   * @param {Object} sources - organization sources fields
   * @param {number} expectedStatus
   * @return {Promise<Object>}
   */
  static async requestToCreateNew(user, fields = {}, sources = {}, expectedStatus = 201) {
    const req = request(server)
      .post(RequestHelper.getOrganizationsUrl())
      .set('Authorization', `Bearer ${user.token}`)
    ;

    if (_.isEmpty(fields)) {
      // noinspection AssignmentToFunctionParameterJS
      fields = this._getMinimumFieldsSet();
    }

    for (const field in fields) {
      req.field(field, fields[field]);
    }

    // TODO - for test
    req.attach('avatar_filename', FileToUploadHelper.getSampleFilePathToUpload());

    for (const sourceSet in sources) {
      sources[sourceSet].forEach((source, i) => {
        for (const field in source) {
          // noinspection JSUnfilteredForInLoop
          const fieldName = `${sourceSet}[${i}][${field}]`;

          if (field !== 'avatar_filename') {
            // noinspection JSUnfilteredForInLoop
            req.field(fieldName, source[field])
          } else {
            const a = 0;
            // noinspection JSUnfilteredForInLoop
            req.attach(fieldName, source[field])
          }
        }
      });
    }

    const res = await req;
    ResponseHelper.expectStatusToBe(res, expectedStatus);

    return res.body;
  }

  static _addSourcesToReq(req, sources) {
    for (const sourceSet in sources) {
      // noinspection JSUnfilteredForInLoop
      sources[sourceSet].forEach((source, i) => {
        for (const field in source) {
          // noinspection JSUnfilteredForInLoop
          const fieldName = `${sourceSet}[${i}][${field}]`;

          if (field !== 'avatar_filename') {
            // noinspection JSUnfilteredForInLoop
            req.field(fieldName, source[field])
          } else {
            if (source[field] === FileToUploadHelper.getSampleFilePathToUpload()) {
              // noinspection JSUnfilteredForInLoop
              req.attach(fieldName, source[field])
            } else if(source[field]) {
              // noinspection JSUnfilteredForInLoop
              req.field(fieldName, source[field])
            }
          }
        }
      });
    }  }

  /**
   *
   * @param {number} orgId
   * @param {Object} user
   * @param {Object} fields
   * @param {Object[]} sources
   * @param {Object[]} socialNetworks
   * @param {number} expectedStatus
   * @return {Promise<Object>}
   */
  static async requestToUpdateExisting(orgId, user, fields, sources = [], socialNetworks = [], expectedStatus = 200) {
    const req = request(server)
      .patch(RequestHelper.getOneOrganizationUrl(orgId))
      .set('Authorization', `Bearer ${user.token}`)
    ;

    for (const field in fields) {
      req.field(field, fields[field]);
    }

    // TODO - refactor socialNetworks part and merge
    if (sources) {
      this._addSourcesToReq(req, sources);
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