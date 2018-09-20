const request = require('supertest');
const server = require('../../../app');
const RequestHelper = require('./request-helper');
const ResponseHelper = require('./response-helper');

const OrganizationsRepositories = require('../../../lib/organizations/repository');

require('jest-expect-message');
class OrganizationsHelper {
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
}

module.exports = OrganizationsHelper;