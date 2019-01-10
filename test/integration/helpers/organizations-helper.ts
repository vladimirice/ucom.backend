/* tslint:disable:max-line-length */
const request = require('supertest');
const server = require('../../../app');
const requestHelper = require('./request-helper');
const responseHelper = require('./response-helper');
const fileToUploadHelper = require('./file-to-upload-helper');
const _ = require('lodash');
const faker = require('faker');

const { orgImageStoragePath } =
  require('../../../lib/organizations/middleware/organization-create-edit-middleware');

const organizationsRepositories = require('../../../lib/organizations/repository');
const entitySourcesRepository = require('../../../lib/entities/repository').Sources;
const orgModelProvider    = require('../../../lib/organizations/service').ModelProvider;
const entityModelProvider = require('../../../lib/entities/service').ModelProvider;

require('jest-expect-message');
class OrganizationsHelper {

  /**
   * @param {number} targetOrgId
   * @param {string} query
   * @param {boolean} dataOnly
   * @param {number} expectedStatus
   * @param {boolean} allowEmpty
   * @return {Promise<Object>}
   *
   * See {@link PostsService#findAndProcessAllForOrgWallFeed}
   */
  static async requestToGetOrgWallFeedAsGuest(targetOrgId, query = '', dataOnly = true, expectedStatus = 200, allowEmpty = false) {
    const url = requestHelper.getOneOrgWallFeed(targetOrgId) + query;

    const res = await request(server)
      .get(url)
    ;
    responseHelper.expectStatusToBe(res, expectedStatus);

    if (expectedStatus === 200) {
      responseHelper.expectValidListResponse(res, allowEmpty);
    }

    if (dataOnly) {
      return res.body.data;
    }

    return res.body;
  }

  // noinspection OverlyComplexFunctionJS
  /**
   * @param {Object} myself
   * @param {number} targetOrgId
   * @param {string} query
   * @param {boolean} dataOnly
   * @param {number} expectedStatus
   * @param {boolean} allowEmpty
   * @return {Promise<Object>}
   *
   * @link postsFetchService#findAndProcessAllForOrgWallFeed
   */
  static async requestToGetOrgWallFeedAsMyself(myself, targetOrgId, query = '', dataOnly = true, expectedStatus = 200, allowEmpty = false) {
    const url = requestHelper.getOneOrgWallFeed(targetOrgId) + query;

    const res = await request(server)
      .get(url)
      .set('Authorization', `Bearer ${myself.token}`)
    ;
    responseHelper.expectStatusToBe(res, expectedStatus);

    if (expectedStatus === 200) {
      responseHelper.expectValidListResponse(res, allowEmpty);
    }

    if (dataOnly) {
      return res.body.data;
    }

    return res.body;
  }

  /**
   *
   * @param {number} orgId
   * @param {Object} user
   * @param {number} expectedStatus
   * @return {Promise<Object>}
   */
  static async requestToFollowOrganization(orgId, user, expectedStatus = 201) {
    const res = await request(server)
      .post(requestHelper.getOrgFollowUrl(orgId))
      .set('Authorization', `Bearer ${user.token}`)
    ;

    responseHelper.expectStatusToBe(res, expectedStatus);

    return res.body;
  }

  /**
   *
   * @param {number} orgId
   * @param {Object} user
   * @param {number} expectedStatus
   * @return {Promise<Object>}
   */
  static async requestToUnfollowOrganization(orgId, user, expectedStatus = 201) {
    const res = await request(server)
      .post(requestHelper.getOrgUnfollowUrl(orgId))
      .set('Authorization', `Bearer ${user.token}`)
    ;

    responseHelper.expectStatusToBe(res, expectedStatus);

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
    await this.requestToUnfollowOrganization(targetOrgId, whoActs);
  }

  /**
   *
   * @param {string} query
   * @return {Promise<Object>}
   */
  static async requestToSearchCommunity(query) {
    const res = await request(server)
      .get(requestHelper.getCommunitySearchUrl(query))
    ;

    responseHelper.expectStatusOk(res);
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
      .get(requestHelper.getPartnershipSearchUrl(query))
    ;
    responseHelper.expectStatusOk(res);

    expect(_.isArray(res.body)).toBeTruthy();

    return res.body;
  }

  /**
   * @param {number} organizationId
   * @return {Promise<Object>}
   */
  static async createSocialNetworksDirectly(organizationId) {
    const entityName = orgModelProvider.getEntityName();

    const entities = [
      {
        source_url: 'https://myurl.com',
        source_type_id: 1, // from Dict - social networks
        source_group_id: 1,
        entity_id: organizationId,
        entity_name: entityName,
      },
      {
        source_url: 'http://mysourceurl2.com',
        source_type_id: 2,
        source_group_id: 1,
        entity_id: organizationId,
        entity_name: entityName,
      },
      {
        source_url: 'http://mysourceurl3.com',
        source_type_id: 3,
        source_group_id: 1,
        entity_id: organizationId,
        entity_name: entityName,
      },
    ];

    return await entitySourcesRepository.bulkCreate(entities);
  }

  /**
   *
   * @param {number} orgId
   * @param {number} expectedStatus
   * @return {Promise<void>}
   */
  static async requestToGetOrgPosts(orgId, expectedStatus = 200) {
    const res = await request(server)
      .get(requestHelper.getOrganizationsPostsUrl(orgId))
    ;
    responseHelper.expectStatusToBe(res, expectedStatus);

    return res.body;
  }

  /**
   *
   * @param {string} filename
   */
  static async isAvatarImageUploaded(filename) {
    await fileToUploadHelper.isFileUploadedToPath(filename, orgImageStoragePath);
  }

  /**
   *
   * @param {Object[]}models
   */
  static checkOrganizationsPreviewFields(models) {
    models.forEach((model) => {
      this.checkOneOrganizationPreviewFields(model);
    });
  }

  /**
   *
   * @param {Object} model
   */
  static checkOneOrgPreviewFieldsIfExists(model) {
    if (!model.organization_id) {
      return;
    }

    this.checkOneOrganizationPreviewFields(model.organization);
  }

  /**
   *
   * @param {Object} model - model with included user
   * @param {string[]|null} givenExpected - model with included user
   */
  static checkOneOrganizationPreviewFields(model, givenExpected = null) {
    expect(model).toBeDefined();
    expect(model).not.toBeNull();
    const expected = givenExpected ? givenExpected : organizationsRepositories.Main.getFieldsForPreview();

    this.checkIsPostProcessedSmell(model);

    if (model.avatar_filename) {
      // @ts-ignore
      expect(model.avatar_filename, 'It seems that org post-processing is not called').toMatch('organizations/');
      // @ts-ignore
      expect(model.avatar_filename, 'It seems that org post-processing is called more than once').not.toMatch('/organizations/');
    }

    // #task - check preview contains only expected fields
    // Problem with followed_by field of organization
    expected.forEach((field) => {
      // @ts-ignore
      expect(model.hasOwnProperty(field), `There is no field: ${field}`).toBeTruthy();
    });

    // ResponseHelper.expectAllFieldsExistence(model, expected);
  }

  static checkIsPostProcessedSmell(model) {
    if (model.avatar_filename) {
      // @ts-ignore
      expect(model.avatar_filename, 'It seems that org post-processing is not called').toMatch('organizations/');
      // @ts-ignore
      expect(model.avatar_filename, 'It seems that org post-processing is called more than once').not.toMatch('/organizations/');
    }
  }

  /**
   * @deprecated - renaming
   * @param {string | null } queryString
   * @returns {Promise<Object[]>}
   */
  static async requestToGetOrganizationsAsGuest(queryString = null) {

    let url = requestHelper.getOrganizationsUrl();

    if (queryString) {
      url += `?${queryString}`;
    }

    const res = await request(server)
      .get(url)
    ;

    responseHelper.expectStatusOk(res);

    return res.body.data;
  }

  /**
   * @deprecated - not required
   * @param {number} page
   * @param {number} perPage
   * @param {boolean} dataOnly
   * @returns {Promise<Object>}
   */
  static async requestAllOrgsWithPagination(page, perPage, dataOnly = false) {
    let url = `${requestHelper.getOrganizationsUrl()}?`;

    const params: string[] = [];

    if (page) {
      params.push(`page=${page}`);
    }

    if (perPage) {
      params.push(`per_page=${perPage}`);
    }

    url += params.join('&');
    const res = await request(server)
      .get(url)
    ;

    responseHelper.expectStatusOk(res);

    if (dataOnly) {
      return res.body.data;
    }

    return res.body;
  }

  /**
   *
   * @param {string | null } queryString
   * @returns {Promise<Object[]>}
   */
  static async requestToGetManyOrganizationsAsGuest(queryString = null) {

    let url = requestHelper.getOrganizationsUrl();

    if (queryString) {
      url += `?${queryString}`;
    }

    const res = await request(server)
      .get(url)
    ;

    responseHelper.expectStatusOk(res);

    return res.body.data;
  }

  static async checkSourcesAfterUpdating(sourceAfter, sourceSet) {
    expect(sourceAfter.some(data => data.id === sourceSet.internal.to_delete.id)).toBeFalsy();
    expect(sourceAfter.some(data => data.id === sourceSet.external.to_delete.id)).toBeFalsy();

    sourceSet.internal.to_check.forEach((source) => {
      const existed = sourceAfter.find(data => data.id === source.id);
      expect(existed).toBeDefined();

      expect(existed).toEqual(source);
    });

    sourceSet.external.to_check.forEach((source) => {
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

    await fileToUploadHelper.isFileUploaded(actualAddedExternal.avatar_filename);
    delete expectedAddedExternal.avatar_filename;

    expect(actualAddedExternal).toMatchObject(expectedAddedExternal);
  }

  static prepareSourceForUpdating(sources) {
    const internalSources: any = [];
    const externalSources: any = [];

    sources.forEach((source) => {
      if (source.source_type === 'internal') {
        internalSources.push(source);
      } else {
        externalSources.push(source);
      }
    });

    const internalSourceToDelete = internalSources[0];
    const internalSourceToAdd = {
      entity_id:    '3', // entity to link on
      entity_name:  orgModelProvider.getEntityName(), // entity to link on

      source_type:  'internal',
    };

    const internalSourcesForRequest = [
      internalSources[1],
      internalSources[2],
      internalSourceToAdd,
    ];

    const externalSourceToDelete = externalSources[0];
    const externalSourceToAdd = {
      source_url:       'https://coolpartnershipnewnew.com',

      title:            'External super community',
      description:      'This is a cool description about cool external community',

      source_type:      'external',
      avatar_filename:  fileToUploadHelper.getSampleFilePathToUpload(),
    };

    // External source should be changed
    externalSources[1].source_url = 'http://example_to_changed.com';
    // #task - change avatar filename also

    const externalSourcesForRequest = [
      externalSources[1],
      externalSources[2],
      externalSourceToAdd,
    ];

    return {
      for_request: _.concat(internalSourcesForRequest, externalSourcesForRequest),

      internal: {
        to_add:     internalSourceToAdd,
        to_delete:  internalSourceToDelete,
        to_check: [
          internalSources[1],
          internalSources[2],
        ],
      },

      external: {
        to_add:     externalSourceToAdd,
        to_delete:  externalSourceToDelete,
        to_check: [
          externalSources[1],
          externalSources[2],
        ],
      },
    };
  }

  /**
   *
   * @param {number} orgId
   * @return {Promise<void>}
   */
  static async createSampleSourcesForOrganization(orgId) {
    const sourceGroupIdCommunity = 2;

    const addToEverySource = {
      entity_id:    orgId,
      entity_name:  orgModelProvider.getEntityName(),

      source_type_id: null,
      is_official: false,
    };

    const toInsert = [
      // community-internal
      {
        source_entity_id: 1,
        source_entity_name: orgModelProvider.getEntityName(),

        source_url: '',
        text_data: '',
        source_group_id: sourceGroupIdCommunity,
        ...addToEverySource,
      },
      {
        source_entity_id: 2,
        source_entity_name: orgModelProvider.getEntityName(),

        source_url: '',
        text_data: '',
        source_group_id: sourceGroupIdCommunity,
        ...addToEverySource,
      },
      {
        source_entity_id: 3,
        source_entity_name: orgModelProvider.getEntityName(),

        source_url: '',
        text_data: '',
        source_group_id: sourceGroupIdCommunity,
        ...addToEverySource,
      },

      // community-external
      {
        source_url: 'https://coolcommunity_external_1.com',
        text_data: '{"title":"External super community 1","description":"This is a cool description about cool external community 1"}',

        source_entity_id: null,
        source_entity_name: null,
        source_group_id: sourceGroupIdCommunity,
        avatar_filename: 'sample_community_external_1.png',
        ...addToEverySource,
      },
      {
        source_url: 'https://coolcommunity_external_2.com',
        text_data: '{"title":"External super community 2","description":"This is a cool description about cool external community 2"}',

        source_entity_id: null,
        source_entity_name: null,
        source_group_id: sourceGroupIdCommunity,
        avatar_filename: 'sample_community_external_2.png',
        ...addToEverySource,
      },
      {
        source_url: 'https://coolcommunity_external_3.com',
        text_data: '{"title":"External super community 3","description":"This is a cool description about cool external community 3"}',

        source_entity_id: null,
        source_entity_name: null,
        source_group_id: sourceGroupIdCommunity,
        avatar_filename: 'sample_community_external_3.png',
        ...addToEverySource,
      },

      ///////// Partnership-internal
      {
        source_url: '',
        is_official: false,
        source_type_id: null,
        source_group_id: 3,
        entity_id: orgId,
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
        entity_id: orgId,
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
        entity_id: orgId,
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
        entity_id: orgId,
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
        entity_id: orgId,
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
        entity_id: orgId,
        entity_name: 'org       ',

        source_entity_id: null,
        source_entity_name: null,
        avatar_filename: 'sample_partnership_external_3.png',
        text_data: '{"title":"External super partnership12345789","description":"This is a cool description about cool external partnership"}',
      },
    ];

    await entityModelProvider.getSourcesModel().bulkCreate(toInsert);
  }

  /**
   *
   * @param {number} orgId
   * @return {Promise<Object>}
   * @link OrganizationService#findOneOrgByIdAndProcess
   */
  static async requestToGetOneOrganizationAsGuest(orgId) {
    const url = requestHelper.getOneOrganizationUrl(orgId);

    const res = await request(server)
      .get(url)
    ;

    responseHelper.expectStatusOk(res);

    return res.body.data;
  }

  // noinspection JSUnusedGlobalSymbols
  /**
   *
   * @param {Object[]}models
   */
  static checkIncludedOrganizationPreviewForArray(models) {
    models.forEach((model) => {
      this.checkIncludedOrganizationPreview(model);
    });
  }

  /**
   *
   * @param {Object} model
   * @param {string[]}givenExpected
   */
  static checkIncludedOrganizationPreview(model, givenExpected = null) {
    const targetModels = model.organizations;

    expect(targetModels).toBeDefined();

    const expected = givenExpected ? givenExpected : organizationsRepositories.Main.getOrganizationModel().getFieldsForPreview().sort();

    targetModels.forEach((model) => {
      responseHelper.expectAllFieldsExistence(model, expected);
    });
  }

  /**
   *
   * @param {Object} user - myself
   * @param {number} orgId
   * @return {Promise<Object>}
   *
   * @link OrganizationService#findOneOrgByIdAndProcess
   */
  static async requestToGetOneOrganizationAsMyself(user, orgId) {
    const url = requestHelper.getOneOrganizationUrl(orgId);

    const res = await request(server)
      .get(url)
      .set('Authorization', `Bearer ${user.token}`)
    ;

    responseHelper.expectStatusOk(res);

    return res.body.data;
  }

  /**
   *
   * @return {Object}
   */
  static getSampleOrganizationsParams() {
    return {
      title: 'Extremely new org',
      currency_to_show: 'CPX',
      powered_by: 'CPX',
      about: 'Extremely cool new about org',
      nickname: 'extreme_nick',
      email: 'extremeemail@gmail.com',
      phone_number: '+19999999',
      country: 'USA',
      city: 'LA',
      address: 'La alley, 18',
      personal_website_url: 'https://extreme.com',
      avatar_filename: fileToUploadHelper.getSampleFilePathToUpload(),
    };
  }

  // noinspection JSUnusedGlobalSymbols
  /**
   *
   * @param {Object} user
   * @return {Promise<Object>}
   */
  static async requestToCreateOrgWithMinimumFields(user) {
    const res = await request(server)
      .post(requestHelper.getOrganizationsUrl())
      .set('Authorization', `Bearer ${user.token}`)
      .field('title', 'Title12345')
      .field('nickname', '123nickname123')
    ;

    responseHelper.expectStatusCreated(res);

    return res.body;
  }

  /**
   *
   * @param {number} orgId
   * @param {Object} user
   * @param {Object} newModelFields
   * @param {Object[]} usersTeam
   * @return {Promise<Object>}
   *
   * @link OrganizationsService#updateOrganization
   */
  static async requestToUpdateOrganization(orgId, user, newModelFields, usersTeam) {

    const res = await request(server)
      .patch(requestHelper.getOneOrganizationUrl(orgId))
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

    responseHelper.expectStatusOk(res);

    return res.body;
  }

  /**
   *
   * @return {{title: *, nickname: *}}
   * @private
   */
  static getMinimumFieldsSet() {
    // noinspection JSCheckFunctionSignatures
    return {
      title:    faker.name.firstName(),
      nickname: faker.lorem.word(),
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
      .post(requestHelper.getOrganizationsUrl())
      .set('Authorization', `Bearer ${user.token}`)
    ;

    if (_.isEmpty(fields)) {
      // noinspection AssignmentToFunctionParameterJS
      // tslint:disable-next-line:no-parameter-reassignment
      fields = this.getMinimumFieldsSet();
    }

    for (const field in fields) {
      req.field(field, fields[field]);
    }

    req.attach('avatar_filename', fileToUploadHelper.getSampleFilePathToUpload());

    for (const sourceSet in sources) {
      sources[sourceSet].forEach((source, i) => {
        for (const field in source) {
          // noinspection JSUnfilteredForInLoop
          const fieldName = `${sourceSet}[${i}][${field}]`;

          if (field !== 'avatar_filename') {
            // noinspection JSUnfilteredForInLoop
            req.field(fieldName, source[field]);
          } else {
            // noinspection JSUnfilteredForInLoop
            req.attach(fieldName, source[field]);
          }
        }
      });
    }

    const res = await req;
    responseHelper.expectStatusToBe(res, expectedStatus);

    return res.body;
  }

  static addSourcesToReq(req, sources) {
    for (const sourceSet in sources) {
      // noinspection JSUnfilteredForInLoop
      sources[sourceSet].forEach((source, i) => {
        for (const field in source) {
          // noinspection JSUnfilteredForInLoop
          const fieldName = `${sourceSet}[${i}][${field}]`;

          if (field !== 'avatar_filename') {
            // noinspection JSUnfilteredForInLoop
            req.field(fieldName, source[field]);
          } else {
            if (source[field] === fileToUploadHelper.getSampleFilePathToUpload()) {
              // noinspection JSUnfilteredForInLoop
              req.attach(fieldName, source[field]);
            } else if (source[field]) {
              // noinspection JSUnfilteredForInLoop
              req.field(fieldName, source[field]);
            }
          }
        }
      });
    }
  }

  // noinspection OverlyComplexFunctionJS
  /**
   *
   * @param {number} orgId
   * @param {Object} user
   * @param {Object} fields
   * @param {Object} sources
   * @param {Object[]} socialNetworks
   * @param {number} expectedStatus
   * @return {Promise<Object>}
   */
  static async requestToUpdateExisting(orgId, user, fields, sources = null, socialNetworks = [], expectedStatus = 200) {
    const req = request(server)
      .patch(requestHelper.getOneOrganizationUrl(orgId))
      .set('Authorization', `Bearer ${user.token}`)
    ;

    for (const field in fields) {
      req.field(field, fields[field]);
    }

    if (sources) {
      this.addSourcesToReq(req, sources);
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
        req.field(fieldName, source[field]);
      }
    });

    const res = await req;
    responseHelper.expectStatusToBe(res, expectedStatus);

    return res.body;
  }

  /**
   * @deprecated
   * @see requestToCreateNew
   * @param {Object} user
   * @param {Object} requiredFields
   * @return {Promise<Object>}
   *
   * @link OrganizationService#processNewOrganizationCreation
   */
  static async requestToCreateNewOrganization(user, requiredFields = null) {
    let newModelFields;

    if (requiredFields) {
      newModelFields = requiredFields;
    } else {
      newModelFields = this.getSampleOrganizationsParams();
    }

    const res = await request(server)
      .post(requestHelper.getOrganizationsUrl())
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

    responseHelper.expectStatusCreated(res);

    return res.body;
  }
}

export = OrganizationsHelper;
