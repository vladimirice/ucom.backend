const status = require('statuses');
const _ = require('lodash');

const OrganizationsRepositories = require('../repository');
const models = require('../../../models');
const {AppError, BadRequestError} = require('../../../lib/api/errors');

const db = models.sequelize;
const UserInputSanitizer = require('../../api/sanitizers/user-input-sanitizer');

class OrganizationService {
  constructor(currentUser) {
    this.currentUser = currentUser;
  }

  /**
   *
   * @param {Object} req
   * @returns {Promise<void>}
   */
  async updateOrganization(req) {
    if (_.isEmpty(req.body) && _.isEmpty(req.files)) {
      throw new BadRequestError({
        'general': 'Updating by empty body and empty file uploading is not allowed'
      });
    }

    const org_id = req.organization_id;
    const user_id = this.currentUser.id;
    const body = this._getRequestBodyWithFilenames(req);

    const updatedModel = await db
      .transaction(async transaction => {
        const [updatedCount, updatedModels] = await OrganizationsRepositories.Main.getOrganizationModel().update(body, {
          where: {
            id: org_id,
            user_id
          },
          returning: true,
          raw: true,
          transaction
        });

        if (updatedCount !== 1) {
          throw new AppError(`No success to update organization with ID ${org_id} and author ID ${user_id}`, status('not found'));
        }

        return updatedModels[0];
      });

    // const jobPayload = PostJobSerializer.getPostDataToCreateJob(updatedModel);

    // try {
    //   await ActivityProducer.publishWithContentUpdating(jobPayload);
    // } catch(err) {
    //   winston.error(err);
    //   winston.error('Not possible to push to the queue. Caught, logged, and proceeded.');
    // }

    return updatedModel;
  }


  /**
   *
   * @param {Object} req
   * @return {Promise<Object>}
   */
  async processNewOrganizationCreation(req) {
    const body = this._processUserRequest(req);

    return await OrganizationsRepositories.Main.createNewOrganization(body);
  }

  /**
   *
   * @return {Promise<Object>}
   */
  async getAllForPreview() {
    const models = await OrganizationsRepositories.Main.findAllForPreview();

    return {
      'data' : models,
      'metadata': [],
    };
  }

  /**
   *
   * @param {number} postId
   * @returns {Promise<Object>}
   */
  async findOneByIdAndProcess(postId) {
    const model = await OrganizationsRepositories.Main.findOneById(postId, this.currentUser.id, false);

    return {
      data: model,
      metadata: []
    };
  }

  /**
   *
   * @param {Object} req
   * @private
   * @return {Object}
   */
  _getRequestBodyWithFilenames(req) {
    let body = req.body;
    // Lets change file
    const files = req.files;
    // noinspection OverlyComplexBooleanExpressionJS
    if (files && files.avatar_filename && files.avatar_filename[0] && files.avatar_filename[0].filename) {
      body.avatar_filename = files.avatar_filename[0].filename;
    }

    return body;
  }

  /**
   *
   * @param {Object} req
   * @return {Object}
   * @private
   */
  _processUserRequest(req) {
    // TODO JOI input validation
    const body = this._getRequestBodyWithFilenames(req);

    const simpleTextFields = OrganizationsRepositories.Main.getModelSimpleTextFields();
    UserInputSanitizer.sanitizeRequestBody(body, simpleTextFields);

    body.user_id = this.currentUser.id;

    return body;
  }
}

module.exports = OrganizationService;