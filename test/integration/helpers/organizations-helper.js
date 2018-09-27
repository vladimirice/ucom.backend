const request = require('supertest');
const server = require('../../../app');
const RequestHelper = require('./request-helper');
const ResponseHelper = require('./response-helper');
const FileToUploadHelper = require('./file-to-upload-helper');

const { orgImageStoragePath } = require('../../../lib/organizations/middleware/organization-create-edit-middleware');

const OrganizationsRepositories = require('../../../lib/organizations/repository');
const UserActivityService = require('../../../lib/users/user-activity-service');
const OrganizationService = require('../../../lib/organizations/service/organization-service');

require('jest-expect-message');
class OrganizationsHelper {

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