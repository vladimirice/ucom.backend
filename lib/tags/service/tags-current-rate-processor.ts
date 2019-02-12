import { PostWithTagCurrentRateDto, TagToRate } from '../interfaces/dto-interfaces';

import TagsRepository = require('../repository/tags-repository');
import PostsRepository = require('../../posts/posts-repository');

const { ContentTypeDictionary } = require('ucom-libs-social-transactions');

interface IndexedTagToRate {
  [index: string]: TagToRate;
}

class TagsCurrentRateProcessor {
  public static async process(batchSize: number = 500) {
    let offset = 0;

    const tagToRate: IndexedTagToRate = {};

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const posts: PostWithTagCurrentRateDto[] =
        await PostsRepository.findAllWithTagsForTagCurrentRate(offset, batchSize);

      if (posts.length === 0) {
        break;
      }

      this.addDataToTagToRate(posts, tagToRate);

      offset += batchSize;
    }

    await this.processTagsStatsAndUpdateTheirStats(tagToRate);
    await TagsRepository.resetTagsCurrentStats(Object.keys(tagToRate));
  }

  private static async processTagsStatsAndUpdateTheirStats(tagToRate: IndexedTagToRate) {
    const batchSize: number = 100;

    let counter: number = 0;
    let whenThenRateString: string = ' ';
    let whenThenPostsAmountString: string = ' ';
    let whenThenMediaPostsAmountString: string = ' ';
    let whenThenDirectPostsAmountString: string = ' ';
    let processedTitles: string[] = [];

    const promises: Promise<Object>[] = [];
    for (const tagTitle in tagToRate) {
      if (!tagToRate.hasOwnProperty(tagTitle)) {
        continue;
      }

      const current = tagToRate[tagTitle];

      current.currentRate = +(current.ratePerPost / current.postsAmount).toFixed(10);
      whenThenRateString +=
        TagsRepository.getWhenThenString(current.title, current.currentRate);
      whenThenPostsAmountString +=
        TagsRepository.getWhenThenString(current.title, current.postsAmount);
      whenThenMediaPostsAmountString +=
        TagsRepository.getWhenThenString(current.title, current.mediaPostsAmount);
      whenThenDirectPostsAmountString +=
        TagsRepository.getWhenThenString(current.title, current.directPostsAmount);
      processedTitles.push(current.title);
      counter += 1;

      if (counter % batchSize === 0) {
        promises.push(
          TagsRepository.updateTagsCurrentStats(
            whenThenRateString,
            whenThenPostsAmountString,
            whenThenMediaPostsAmountString,
            whenThenDirectPostsAmountString,
            processedTitles,
          ),
        );
        counter = 0;
        whenThenRateString = ' ';
        whenThenPostsAmountString = ' ';
        whenThenMediaPostsAmountString = ' ';
        whenThenDirectPostsAmountString = ' ';
        processedTitles = [];
      }
    }

    if (whenThenRateString !== ' ') {
      promises.push(
        TagsRepository.updateTagsCurrentStats(
          whenThenRateString,
          whenThenPostsAmountString,
          whenThenMediaPostsAmountString,
          whenThenDirectPostsAmountString,
          processedTitles,
        ),
      );
    }

    await Promise.all(promises);
  }

  private static addDataToTagToRate(
    posts: PostWithTagCurrentRateDto[],
    tagToRate: IndexedTagToRate,
  ): void {
    posts.forEach((post) => {
      const oneTagRatePerPost: number = this.getOneTagRatePerPost(post);

      post.entity_tags.forEach((title: string) => {
        if (!tagToRate[title]) {
          tagToRate[title] = {
            title,
            ratePerPost: 0,
            postsAmount: 0,
            mediaPostsAmount: 0,
            directPostsAmount: 0,
            currentRate: 0,
          };
        }

        switch (post.post_type_id) {
          case ContentTypeDictionary.getTypeMediaPost():
            tagToRate[title].mediaPostsAmount += 1;
            break;
          case ContentTypeDictionary.getTypeDirectPost():
            tagToRate[title].directPostsAmount += 1;
            break;
          default:
            // do nothing
        }

        tagToRate[title].ratePerPost += oneTagRatePerPost;
        tagToRate[title].postsAmount += 1;
      });
    });
  }

  private static getOneTagRatePerPost(post: PostWithTagCurrentRateDto): number {
    return +(post.current_rate / post.entity_tags.length).toFixed(10);
  }
}

export = TagsCurrentRateProcessor;
