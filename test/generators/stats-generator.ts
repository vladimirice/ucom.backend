import PostsGenerator = require('./posts-generator');
import PostsHelper = require('../integration/helpers/posts-helper');
import _ = require('lodash');

class StatsGenerator {
  public static async generatePosts(
    expectedOrderBy: string,
    amount: number,
  ): Promise<{expectedValues: any[], expectedForOrg: any[], expectedForUsers: any[]}> {
    const postsIds: number[] = await PostsGenerator.createManyDefaultMediaPostsByDifferentUsers(amount);
    const expectedValues = await PostsHelper.setSamplePositiveStatsParametersToPosts(postsIds, expectedOrderBy);

    let indexToRemain;
    let getRidOfIndex;

    // This is special disturbance in order to catch not distinct related organization issue
    for (let i = 0; i < expectedValues.length; i += 1) {
      if (getRidOfIndex) {
        break;
      }

      const item = expectedValues[i];
      if (!item.organization_id) {
        continue;
      }

      if (!indexToRemain) {
        indexToRemain = i;
      } else if (!getRidOfIndex) {
        getRidOfIndex = i;
      }
    }

    await PostsHelper.changeOrganizationId(expectedValues[indexToRemain].post_id, expectedValues[getRidOfIndex].organization_id);

    let expectedForOrg = _.cloneDeep(expectedValues);
    expectedForOrg[indexToRemain].organization_id = expectedValues[getRidOfIndex].organization_id;

    expectedForOrg = expectedForOrg.filter((item, index) => item.organization_id !== null && index !== getRidOfIndex);

    const userIdAlready: number[] = [];

    let expectedForUsers = _.cloneDeep(expectedValues);
    expectedForUsers = expectedForUsers.filter((item) => {
      if (!~userIdAlready.indexOf(item.user_id)) {
        userIdAlready.push(item.user_id);

        return true;
      }

      return false;
    });

    return {
      expectedValues,
      expectedForOrg,
      expectedForUsers,
    };
  }
}

export = StatsGenerator;
