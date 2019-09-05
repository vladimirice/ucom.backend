import { ContentTypesDictionary } from 'ucom.libs.common';
import { BadRequestError, HttpForbiddenError } from '../../../api/errors';
import { OrgModel } from '../../interfaces/model-interfaces';

import OrganizationsRepository = require('../../repository/organizations-repository');
import PostsRepository = require('../../../posts/posts-repository');
import OrganizationsDiscussionsRepository = require('../repository/organizations-discussions-repository');

const allowedDiscussionsTypes: number[] = [
  ContentTypesDictionary.getTypeMediaPost(),
];

const ALLOWED_DISCUSSIONS_AMOUNT_PER_ORG = 10;

class OrganizationsValidateDiscussions {
  public static async validateDeleteRequest(orgModel: OrgModel, currentUserId: number): Promise<void> {
    const isOrgMember = await OrganizationsRepository.isOrgMember(currentUserId, orgModel.id);

    if (!isOrgMember) {
      throw new HttpForbiddenError('Only author of organization is able to change discussions');
    }
  }

  public static throwErrorIfMaxNumberOfPostsExceeded(orgModel: OrgModel, numberOfPosts: number): void {
    if (numberOfPosts > ALLOWED_DISCUSSIONS_AMOUNT_PER_ORG) {
      throw new BadRequestError(`Organization with ID ${orgModel.id} already has maximum allowed amount of discussions: ${ALLOWED_DISCUSSIONS_AMOUNT_PER_ORG}`);
    }
  }

  public static async isItPossibleToAddOneMoreDiscussion(orgModel: OrgModel): Promise<void> {
    const discussionsAmount = await OrganizationsDiscussionsRepository.countDiscussions(orgModel.id);

    this.throwErrorIfMaxNumberOfPostsExceeded(orgModel, discussionsAmount + 1);
  }

  public static async validateOneDiscussion(
    orgModel: OrgModel,
    postId: number,
    currentUserId: number,
  ): Promise<void> {
    if (!postId) {
      throw new BadRequestError('Post ID field must be a valid number');
    }

    const [isOrgMember, post] = await Promise.all([
      OrganizationsRepository.isOrgMember(currentUserId, orgModel.id),
      PostsRepository.findOnlyPostItselfById(postId),
    ]);

    if (!isOrgMember) {
      throw new HttpForbiddenError('Only community team member is able to change discussions');
    }

    if (post === null) {
      throw new BadRequestError(`There is no post with ID: ${postId}`);
    }

    if (!~allowedDiscussionsTypes.indexOf(post.post_type_id)) {
      throw new BadRequestError(`Post type ID is not allowed. Allowed types are: ${allowedDiscussionsTypes.join(', ')}`);
    }
  }
}

export = OrganizationsValidateDiscussions;
