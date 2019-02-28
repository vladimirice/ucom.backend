import { BadRequestError } from '../../../api/errors';

import knex = require('../../../../config/knex');
import OrganizationsDiscussionsRepository = require('../repository/organizations-discussions-repository');
import OrganizationsValidateDiscussions = require('./organizations-validate-discussions');

class OrganizationsModifyDiscussions {
  public static async deleteAllDiscussions(orgModel, currentUserId: number) {
    await OrganizationsValidateDiscussions.validateDeleteRequest(orgModel, currentUserId);

    await OrganizationsDiscussionsRepository.deleteAllDiscussions(orgModel.id);
  }

  public static async processNewDiscussionsState(orgModel, body: any, currentUserId: number) {
    if (!body.discussions) {
      throw new BadRequestError('field "discussions" is required');
    }

    const postsIds: number[] = [];
    for (const obj of body.discussions) {
      const id = +obj.id;
      if (!id) {
        throw new BadRequestError('Not all "discussions" objects have id field');
      }

      await OrganizationsValidateDiscussions.validateOneDiscussion(orgModel, id, currentUserId);

      postsIds.push(id);
    }

    await knex.transaction(async (trx) => {
      await OrganizationsDiscussionsRepository.updateDiscussionsState(orgModel.id, postsIds, trx);
    });
  }
}

export = OrganizationsModifyDiscussions;
