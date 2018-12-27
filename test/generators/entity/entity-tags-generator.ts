const postsGenerator  = require('../posts-generator');
const orgsGenerator   = require('../organizations-generator');

const tagHelper   = require('../../integration/helpers/tags-helper');
const postsHelper = require('../../integration/helpers/posts-helper');

class EntityTagsGenerator {

  public static async createPostsWithTagsForOrgs(userVlad, userJane) {
    const [
      orgOneId,
      orgTwoId,
      orgThreeId,
      orgFourId,
    ] = await Promise.all([
      orgsGenerator.createOrgWithoutTeam(userVlad),
      orgsGenerator.createOrgWithoutTeam(userJane),
      orgsGenerator.createOrgWithoutTeam(userVlad),
      orgsGenerator.createOrgWithoutTeam(userVlad),
    ]);

    const postTags = [
      'summer',
      'undefined',
    ];

    const [
      vladPostOneId,
      vladPostTwoId,
      vladPostThreeId,
      vladPostFourId,
      janePostIdOne,
    ] = await Promise.all([
      postsGenerator.createMediaPostOfOrganization(userVlad, orgOneId, {
        description: `Hi everyone! #${postTags[0]} is so close`,
      }),
      postsGenerator.createMediaPostOfOrganization(userVlad, orgOneId, {
        description: `Hi everyone! #${postTags[0]} is so close close close ${postTags[1]}`,
      }),
      postsGenerator.createMediaPostOfOrganization(userVlad, orgThreeId, {
        description: `Hi everyone! #${postTags[1]} is so close`,
      }),
      postsGenerator.createMediaPostOfOrganization(userVlad, orgFourId, {
        description: `Hi everyone! #${postTags[0]} is so close ha`,
      }),
      postsGenerator.createMediaPostOfOrganization(userJane, orgTwoId, {
        description: `Hi everyone! #${postTags[0]} is so close ha`,
      }),
    ]);

    await Promise.all([
      tagHelper.getPostWhenTagsAreProcessed(vladPostOneId),
      tagHelper.getPostWhenTagsAreProcessed(vladPostTwoId),
      tagHelper.getPostWhenTagsAreProcessed(vladPostThreeId),
      tagHelper.getPostWhenTagsAreProcessed(vladPostFourId),
      tagHelper.getPostWhenTagsAreProcessed(janePostIdOne),
    ]);

    return {
      postTags,
      postIds: [
        vladPostOneId,
        vladPostTwoId,
        vladPostThreeId,
        vladPostFourId,
        janePostIdOne,
      ],
      orgIds: [
        orgOneId,
        orgTwoId,
        orgThreeId,
        orgFourId,
      ],
    };
  }
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

    const vladPostTwoId = await postsGenerator.createMediaPostByUserHimself(userVlad, {
      description: `Hi everyone again! #${postTwoTags[0]} is so close.
      Lets organize #${postTwoTags[1]} #${postTwoTags[2]}`,
    });

    const janePostOneId = await postsGenerator.createMediaPostByUserHimself(userJane, {
      description: `Hi everyone! #${janePostOneTags[0]} is so close.
      Lets buy some #${janePostOneTags[1]} and #${janePostOneTags[2]} and #${janePostOneTags[1]}`,
    });

    const orgOneId = await orgsGenerator.createOrgWithoutTeam(userVlad);
    const vladOrgPostId = await postsGenerator.createMediaPostOfOrganization(userVlad, orgOneId, {
      description: `Hi everyone! #${tagsSet[0]} is so close`,
    });

    const directPost =
      await this.createDirectPostForUserWithTags(userVlad, userJane, tagsSet[0], tagsSet[1]);

    await Promise.all([
      tagHelper.getPostWhenTagsAreProcessed(janePostOneId),
      tagHelper.getPostWhenTagsAreProcessed(vladOrgPostId),
      tagHelper.getPostWhenTagsAreProcessed(directPost.id),
      tagHelper.getPostWhenTagsAreProcessed(vladPostOneId),
      tagHelper.getPostWhenTagsAreProcessed(vladPostTwoId),
    ]);

    const postsPreview = {
      [vladPostOneId]: {
        user: userVlad,
        tags: postOneTags,
      },
      [vladPostTwoId]: {
        user: userVlad,
        tags: postTwoTags,
      },
      [janePostOneId]: {
        user: userJane,
        tags: janePostOneTags,
      },
      [vladOrgPostId]: {
        user: userVlad,
        tags: [
          tagsSet[0],
        ],
      },
      [directPost.id]: {
        user: userVlad,
        tags: [
          tagsSet[0],
          tagsSet[1],
        ],
      },
    };

    return {
      postsPreview,
      tagsTitles: tagsSet,
      postsIds: [
        vladPostOneId,
        vladPostTwoId,
        janePostOneId,
        directPost.id,
        vladOrgPostId,
      ],
      posts: {
        total_amount: 4,
        vlad: [
          vladPostOneId,
          vladPostTwoId,
        ],
      },
    };
  }

  public static async createDirectPostForUserWithTags(
    userVlad: Object,
    userJane: Object,
    firstTag: string,
    secondTag: string,
  ) {
    const description = `Our super #${firstTag} post #${secondTag} description`;

    const directPost = await postsHelper.requestToCreateDirectPostForUser(
      userVlad,
      userJane,
      description,
    );

    return tagHelper.getPostWhenTagsAreProcessed(directPost.id);
  }
}

export = EntityTagsGenerator;
