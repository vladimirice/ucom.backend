import { BadRequestError, HttpForbiddenError } from '../../api/errors';

import OrganizationsToEntitiesRepository = require('../repository/organizations-to-entities-repository');
import knex = require('../../../config/knex');

class OrganizationsCreatorRelated {
  // @ts-ignore
  public static async processNewDiscussionsState(orgModel, body: any, currentUserId: number) {
    if (!body.discussions) {
      throw new BadRequestError('field "discussions" is required');
    }

    if (!orgModel.isAuthor(currentUserId)) {
      throw new HttpForbiddenError('Only author of organization is able to change discussions');
    }

    const postsIds: number[] = [];
    for (const obj of body.discussions) {
      const id = +obj.id;
      if (!id) {
        throw new BadRequestError('Not all "discussions" objects have id field');
      }

      postsIds.push(id);
    }

    await knex.transaction(async (trx) => {
      await OrganizationsToEntitiesRepository.updateDiscussionsState(orgModel.id, postsIds, trx);
    });
  }
}

export = OrganizationsCreatorRelated;
