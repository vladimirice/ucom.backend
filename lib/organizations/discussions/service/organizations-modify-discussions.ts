import { BadRequestError } from '../../../api/errors';

import OrganizationsDiscussionsRepository = require('../repository/organizations-discussions-repository');
import OrganizationsValidateDiscussions = require('./organizations-validate-discussions');
import { OrgModel } from '../../interfaces/model-interfaces';
import { StringToAnyCollection } from '../../../common/interfaces/common-types';

class OrganizationsModifyDiscussions {
  public static async processNewDiscussionsState(
    orgModel: OrgModel,
    body: StringToAnyCollection,
    currentUserId: number,
  ): Promise<void> {
    const postsIds: number[] = await this.extractPostsIdsFromBody(body, orgModel, currentUserId);

    OrganizationsValidateDiscussions.throwErrorIfMaxNumberOfPostsExceeded(orgModel, postsIds.length);
    await OrganizationsDiscussionsRepository.updateDiscussionsState(orgModel.id, postsIds);
  }

  public static async deleteAllDiscussions(orgModel: OrgModel, currentUserId: number): Promise<void> {
    await OrganizationsValidateDiscussions.validateDeleteRequest(orgModel, currentUserId);

    await OrganizationsDiscussionsRepository.deleteAllDiscussions(orgModel.id);
  }

  private static async extractPostsIdsFromBody(
    body: StringToAnyCollection,
    orgModel: OrgModel,
    currentUserId: number,
  ): Promise<number[]> {
    if (!body.discussions) {
      throw new BadRequestError('field "discussions" is required');
    }

    const postsIds: number[] = [];
    for (const obj of body.discussions) {
      const onePostId = +obj.id;
      if (!onePostId) {
        throw new BadRequestError('Not all "discussions" objects have id field');
      }

      await OrganizationsValidateDiscussions.validateOneDiscussion(orgModel, onePostId, currentUserId);

      if (postsIds.includes(onePostId)) {
        throw new BadRequestError(`All discussions must be unique. Duplicate ID is found: ${onePostId}`);
      }

      postsIds.push(onePostId);
    }

    return postsIds;
  }
}

export = OrganizationsModifyDiscussions;
