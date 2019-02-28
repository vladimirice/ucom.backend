import { BadRequestError, HttpForbiddenError } from '../../api/errors';

import OrganizationsToEntitiesRepository = require('../repository/organizations-to-entities-repository');
import knex = require('../../../config/knex');
import OrganizationsRepository = require('../repository/organizations-repository');

class OrganizationsCreatorRelated {
  public static async validateOneDiscussion(orgModel: any, postId: number, currentUserId: number): Promise<void> {
    if (!postId) {
      throw new BadRequestError('Post ID field must be a valid number');
    }

    const [isOrgMember] = await Promise.all([
      OrganizationsRepository.isOrgMember(currentUserId, orgModel.id),
    ]);

    if (!isOrgMember) {
      throw new HttpForbiddenError('Only author of organization is able to change discussions');
    }

    // const post = PostsRepository.findOneByIdV2(postId, true);

  /* I'm an author of org or team member
    * Organization ID exists
    * this is only publication type of post
    * Posts amount is no more than 10
    * Post ID exists
*/
  }

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
