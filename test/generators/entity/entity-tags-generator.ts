const postsGenerator  = require('../posts-generator');
const orgsGenerator   = require('../organizations-generator');
const tagHelper       = require('../../integration/helpers/tags-helper');

class EntityTagsGenerator {
  /**
   *
   * @param {Object} userVlad
   * @param {Object} userJane
   */
  public static async createPostsWithTags(userVlad: Object, userJane: Object) {
    const tagsSet = [
      'summer', 'party', 'openair', 'eos', 'ether',
    ];

    const postOneTags = [
      tagsSet[0],
      tagsSet[1],
    ];

    const postTwoTags = [
      tagsSet[0], // existing tag, not unique
      tagsSet[2], // new tag
      tagsSet[1], // existing tag, not unique
    ];

    const janePostOneTags = [
      tagsSet[2], // existing tag, not unique
      tagsSet[3], // new tag
      tagsSet[4], // new tag
    ];

    const vladPostOneId = await postsGenerator.createMediaPostByUserHimself(userVlad, {
      description: `Hi everyone! #${postOneTags[0]} #${postOneTags[0]} is so close.
      Lets organize a #${postOneTags[1]}`,
    });

    await tagHelper.getPostWhenTagsAreProcessed(vladPostOneId);

    const vladPostTwoId = await postsGenerator.createMediaPostByUserHimself(userVlad, {
      description: `Hi everyone again! #${postTwoTags[0]} is so close.
      Lets organize #${postTwoTags[1]} #${postTwoTags[2]}`,
    });

    await tagHelper.getPostWhenTagsAreProcessed(vladPostTwoId);

    const janePostOneId = await postsGenerator.createMediaPostByUserHimself(userJane, {
      description: `Hi everyone! #${janePostOneTags[0]} is so close.
      Lets buy some #${janePostOneTags[1]} and #${janePostOneTags[2]} and #${janePostOneTags[1]}`,
    });

    const orgOneId = await orgsGenerator.createOrgWithoutTeam(userVlad);
    await postsGenerator.createMediaPostOfOrganization(userVlad, orgOneId, {
      description: `Hi everyone! #${tagsSet[0]} is so close`,
    });

    await tagHelper.getPostWhenTagsAreProcessed(janePostOneId);
  }
}

export = EntityTagsGenerator;
