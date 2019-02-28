import { BadRequestError, HttpForbiddenError } from '../../api/errors';

import OrganizationsToEntitiesRepository = require('../repository/organizations-to-entities-repository');
import knex = require('../../../config/knex');
import OrganizationsRepository = require('../repository/organizations-repository');
import PostsRepository = require('../../posts/posts-repository');

const { ContentTypeDictionary } = require('ucom-libs-social-transactions');

const allowedDiscussionsTypes: number[] = [
  ContentTypeDictionary.getTypeMediaPost(),
];

const ALLOWED_DISCUSSIONS_AMOUNT_PER_ORG = 10;

class OrganizationsCreatorRelated {
  public static async validateOneDiscussion(orgModel: any, postId: number, currentUserId: number): Promise<void> {
    if (!postId) {
      throw new BadRequestError('Post ID field must be a valid number');
    }

    const [isOrgMember, post, discussionsAmount] = await Promise.all([
      OrganizationsRepository.isOrgMember(currentUserId, orgModel.id),
      PostsRepository.findOnlyPostItselfById(postId),
      OrganizationsToEntitiesRepository.countDiscussions(orgModel.id),
    ]);

    if (discussionsAmount === ALLOWED_DISCUSSIONS_AMOUNT_PER_ORG) {
      throw new BadRequestError(`Organization with ID ${orgModel.id} already has maximum allowed amount of discussions: ${ALLOWED_DISCUSSIONS_AMOUNT_PER_ORG}`);
    }

    if (!isOrgMember) {
      throw new HttpForbiddenError('Only author of organization is able to change discussions');
    }

    if (post === null) {
      throw new BadRequestError(`There is no post with ID: ${postId}`);
    }

    if (!~allowedDiscussionsTypes.indexOf(post.post_type_id)) {
      throw new BadRequestError(`Post type ID is not allowed. Allowed types are: ${allowedDiscussionsTypes.join(', ')}`);
    }

    if (post.organization_id === null || post.organization_id !== orgModel.id) {
      throw new BadRequestError('Post should be made by organization member');
    }
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
