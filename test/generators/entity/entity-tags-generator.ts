import { UserModel } from '../../../lib/users/interfaces/model-interfaces';

import { StringToNumberCollection } from '../../../lib/common/interfaces/common-types';
import { DbTag } from '../../../lib/tags/interfaces/dto-interfaces';

import OrganizationsGenerator = require('../organizations-generator');
import PostsGenerator = require('../posts-generator');
import TagsHelper = require('../../integration/helpers/tags-helper');
import TagsCurrentRateProcessor = require('../../../lib/tags/service/tags-current-rate-processor');
import TagsRepository = require('../../../lib/tags/repository/tags-repository');

class EntityTagsGenerator {
  public static async createPostsWithTagsForOrgs(userVlad, userJane) {
    const [
      orgOneId,
      orgTwoId,
      orgThreeId,
      orgFourId,
    ] = await Promise.all([
      OrganizationsGenerator.createOrgWithoutTeam(userVlad),
      OrganizationsGenerator.createOrgWithoutTeam(userJane),
      OrganizationsGenerator.createOrgWithoutTeam(userVlad),
      OrganizationsGenerator.createOrgWithoutTeam(userVlad),
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
      PostsGenerator.createMediaPostOfOrganization(userVlad, orgOneId, {
        description: `Hi everyone! #${postTags[0]} is so close`,
      }),
      PostsGenerator.createMediaPostOfOrganization(userVlad, orgOneId, {
        description: `Hi everyone! #${postTags[0]} is so close close close ${postTags[1]}`,
      }),
      PostsGenerator.createMediaPostOfOrganization(userVlad, orgThreeId, {
        description: `Hi everyone! #${postTags[1]} is so close`,
      }),
      PostsGenerator.createMediaPostOfOrganization(userVlad, orgFourId, {
        description: `Hi everyone! #${postTags[0]} is so close ha`,
      }),
      PostsGenerator.createMediaPostOfOrganization(userJane, orgTwoId, {
        description: `Hi everyone! #${postTags[0]} is so close ha`,
      }),
    ]);

    await Promise.all([
      TagsHelper.getPostWhenTagsAreProcessed(vladPostOneId),
      TagsHelper.getPostWhenTagsAreProcessed(vladPostTwoId),
      TagsHelper.getPostWhenTagsAreProcessed(vladPostThreeId),
      TagsHelper.getPostWhenTagsAreProcessed(vladPostFourId),
      TagsHelper.getPostWhenTagsAreProcessed(janePostIdOne),
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

  public static async createTagsViaNewPostsByAmount(
    myself: UserModel,
    tagsAmount: number,
  ): Promise<number[]> {
    const tagPrefix = 'party';
    const tagsTitles: string[] = [];
    for (let i = 1; i <= tagsAmount; i += 1) {
      tagsTitles.push(`${tagPrefix}_${i}`);
    }

    const res = await this.createManyTagsViaManyNewPosts(myself, tagsTitles);

    await TagsCurrentRateProcessor.process();

    return res;
  }

  public static async createManyTagsViaManyNewPosts(
    myself: UserModel,
    tagsTitles: string[],
  ): Promise<number[]> {
    const promises: Promise<any>[] = [];

    tagsTitles.forEach((title: string) => {
      promises.push(this.createTagViaNewPost(myself, title));
    });

    return Promise.all(promises);
  }

  public static async createTagViaNewPostAndGetTag(
    myself: UserModel,
    tagTitle: string,
  ): Promise<DbTag> {
    await this.createTagViaNewPost(myself, tagTitle);

    // @ts-ignore
    return TagsRepository.findOneByTitle(tagTitle);
  }

  public static async createTagViaNewPost(
    myself: UserModel,
    tagTitle: string,
  ): Promise<number> {
    const postId: number = await PostsGenerator.createMediaPostByUserHimself(myself, {
      description: `Hi everyone! #${tagTitle} is so close.`,
    });

    await TagsHelper.getPostWhenTagsAreProcessed(postId);

    return postId;
  }

  public static async createManyTagsViaNewPostAndGetTagsIds(
    myself: UserModel,
    tagsTitles: string[],
  ): Promise<StringToNumberCollection> {
    let description = 'Hi everyone! So close.';
    for (const title of tagsTitles) {
      description += `#${title} `;
    }

    const postId: number = await PostsGenerator.createMediaPostByUserHimself(myself, {
      description,
    });

    await TagsHelper.getPostWhenTagsAreProcessed(postId);

    return TagsRepository.findAllTagsByTitles(tagsTitles);
  }

  public static async createTagViaNewDirectPost(
    myself: UserModel,
    wallOwner: UserModel,
    tagTitle: string,
  ): Promise<number> {
    const description = `Hi everyone! #${tagTitle} is so close.`;

    const postId: number = await PostsGenerator.createLegacyDirectPostForUserAndGetId(
      myself,
      wallOwner,
      description,
    );

    await TagsHelper.getPostWhenTagsAreProcessed(postId);

    return postId;
  }

  public static async createPostsWithTags(
    userVlad: UserModel,
    userJane: UserModel,
  ): Promise<any> {
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

    const vladPostOneId = await PostsGenerator.createMediaPostByUserHimself(userVlad, {
      description: `Hi everyone! #${postOneTags[0]} #${postOneTags[0]} is so close.
      Lets organize a #${postOneTags[1]}`,
    });

    const vladPostTwoId = await PostsGenerator.createMediaPostByUserHimself(userVlad, {
      description: `Hi everyone again! #${postTwoTags[0]} is so close.
      Lets organize #${postTwoTags[1]} #${postTwoTags[2]}`,
    });

    const janePostOneId = await PostsGenerator.createMediaPostByUserHimself(userJane, {
      description: `Hi everyone! #${janePostOneTags[0]} is so close.
      Lets buy some #${janePostOneTags[1]} and #${janePostOneTags[2]} and #${janePostOneTags[1]}`,
    });

    const orgOneId = await OrganizationsGenerator.createOrgWithoutTeam(userVlad);
    const vladOrgPostId = await PostsGenerator.createMediaPostOfOrganization(userVlad, orgOneId, {
      description: `Hi everyone! #${tagsSet[0]} is so close`,
    });

    const directPost =
      await this.createDirectPostForUserWithTags(userVlad, userJane, tagsSet[0], tagsSet[1]);

    await Promise.all([
      TagsHelper.getPostWhenTagsAreProcessed(janePostOneId),
      TagsHelper.getPostWhenTagsAreProcessed(vladOrgPostId),
      TagsHelper.getPostWhenTagsAreProcessed(directPost.id),
      TagsHelper.getPostWhenTagsAreProcessed(vladPostOneId),
      TagsHelper.getPostWhenTagsAreProcessed(vladPostTwoId),
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
      tagNameToPostsIds: {
        [tagsSet[0]]: [
          vladPostOneId,
          vladPostTwoId,
          vladOrgPostId,
          directPost.id,
        ],
      },
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
    userVlad: UserModel,
    userJane: UserModel,
    firstTag: string,
    secondTag: string = '',
    thirdTag: string = '',
  ) {
    let description: string = `Our super #${firstTag} post`;

    if (secondTag) {
      description += `  #${secondTag}`;
    }
    if (thirdTag) {
      description += `  #${thirdTag}`;
    }

    const directPost = await PostsGenerator.createUserDirectPostForOtherUser(
      userVlad,
      userJane,
      description,
    );

    return TagsHelper.getPostWhenTagsAreProcessed(directPost.id);
  }
}

export = EntityTagsGenerator;
