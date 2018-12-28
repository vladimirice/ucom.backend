import { PostWithTagCurrentRateDto, TagToRate } from '../interfaces/dto-interfaces';

const postsRepository = require('../../posts/posts-repository');
const tagsRepository  = require('../../tags/repository/tags-repository');

interface IndexedTagToRate {
  [index: string]: TagToRate;
}

class TagsCurrentRateProcessor {
  public static async process(batchSize: number = 500) {
    let offset = 0;

    const tagToRate: IndexedTagToRate = {};

    while (true) {
      const posts: PostWithTagCurrentRateDto[] =
        await postsRepository.findAllWithTagsForTagCurrentRate(offset, batchSize);

      if (posts.length === 0) {
        break;
      }

      this.addDataToTagToRate(posts, tagToRate);

      offset += batchSize;
    }

    await this.processTagsStatsAndUpdateTheirRates(tagToRate);
  }

  private static async processTagsStatsAndUpdateTheirRates(tagToRate: IndexedTagToRate) {
    const batchSize: number = 100;

    let counter: number = 0;
    let whenThenString: string = ' ';
    let processedTitles: string[] = [];

    const promises: Promise<Object>[] = [];
    for (const tagTitle in tagToRate) {
      const current = tagToRate[tagTitle];

      current.currentRate = +(current.ratePerPost / current.postsAmount).toFixed(10);
      whenThenString += tagsRepository.getWhenThenString(current.title, current.currentRate);
      processedTitles.push(current.title);
      counter += 1;

      if (counter % batchSize === 0) {
        promises.push(
          tagsRepository.updateTagsCurrentRates(whenThenString, processedTitles),
        );
        counter = 0;
        whenThenString = ' ';
        processedTitles = [];
      }
    }

    if (whenThenString !== ' ') {
      promises.push(
        tagsRepository.updateTagsCurrentRates(whenThenString, processedTitles),
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
            currentRate: 0,
          };
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
