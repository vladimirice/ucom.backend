import { BadRequestError, HttpForbiddenError } from '../../../api/errors';

import OrganizationsRepository = require('../../repository/organizations-repository');
import PostsRepository = require('../../../posts/posts-repository');
import OrganizationsDiscussionsRepository = require('../repository/organizations-discussions-repository');

const { ContentTypeDictionary } = require('ucom-libs-social-transactions');

const allowedDiscussionsTypes: number[] = [
  ContentTypeDictionary.getTypeMediaPost(),
];

const ALLOWED_DISCUSSIONS_AMOUNT_PER_ORG = 10;

class OrganizationsValidateDiscussions {
  public static async validateDeleteRequest(orgModel: any, currentUserId: number): Promise<void> {
    const isOrgMember = await OrganizationsRepository.isOrgMember(currentUserId, orgModel.id);

    if (!isOrgMember) {
      throw new HttpForbiddenError('Only author of organization is able to change discussions');
    }
  }

  public static async validateOneDiscussion(orgModel: any, postId: number, currentUserId: number): Promise<void> {
    if (!postId) {
      throw new BadRequestError('Post ID field must be a valid number');
    }

    const [isOrgMember, post, discussionsAmount] = await Promise.all([
      OrganizationsRepository.isOrgMember(currentUserId, orgModel.id),
      PostsRepository.findOnlyPostItselfById(postId),
      OrganizationsDiscussionsRepository.countDiscussions(orgModel.id),
    ]);

    if (discussionsAmount === ALLOWED_DISCUSSIONS_AMOUNT_PER_ORG) {
      throw new BadRequestError(`Organization with ID ${orgModel.id} already has maximum allowed amount of discussions: ${ALLOWED_DISCUSSIONS_AMOUNT_PER_ORG}`);
    }

    if (!isOrgMember) {
      throw new HttpForbiddenError('Only community team member is able to change discussions');
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
}

export = OrganizationsValidateDiscussions;
