const ActivityHelper = require('../integration/helpers').Activity;
const orgGen = require('./organizations-generator');
const postGen = require('./posts-generator');
const commentsGen = require('./comments-generator');

class CommonGenerator {
  static async createAllTypesOfNotifications(userVlad, userJane, userPetr, userRokky) {
    // User Jane = 1 - vlad follows you
    await ActivityHelper.requestToCreateFollow(userVlad, userJane);

    // User Jane = 2 - vlad invites you to his org
    const teamMembers = [ userJane, userPetr ];
    await orgGen.createOrgWithTeam(userVlad, teamMembers);

    // User Jane = 3 - Rokky follows your organization
    const orgId = await orgGen.createOrgWithoutTeam(userJane);
    await ActivityHelper.requestToFollowOrganization(orgId, userRokky);

    // User Jane = 4 - User vlad comments your post
    const postId = await postGen.createMediaPostByUserHimself(userJane);
    const newComment = await commentsGen.createCommentForPost(postId, userPetr);

    // User Jane = 5 - comments her own post. As is
    const newJaneComment = await commentsGen.createCommentForPost(postId, userJane);

    // User Jane = 6 - User Rokky comments her comment
    const newCommentOnComment = await commentsGen.createCommentOnComment(postId, newJaneComment.id, userRokky);
  }

}

module.exports = CommonGenerator;