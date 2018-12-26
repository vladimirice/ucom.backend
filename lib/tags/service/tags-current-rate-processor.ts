import { TagCurrentRateDto, StringToNumObj } from '../interfaces/dto-interfaces';

const postsRepository = require('../../posts/posts-repository');
const tagsRepository  = require('../../tags/repository/tags-repository');

class TagsCurrentRateProcessor {
  public static async process(batchSize: number = 500) {
    let offset = 0;

    const tagToRate: StringToNumObj = {};

    while (true) {
      const posts: TagCurrentRateDto[] =
        await postsRepository.findAllWithTagsForTagCurrentRate(offset, batchSize);

      if (posts.length === 0) {
        break;
      }

      this.addDataToTagToRate(posts, tagToRate);

      await tagsRepository.updateTagsCurrentRates(tagToRate);

      offset += batchSize;
    }
  }

  private static addDataToTagToRate(
    posts: TagCurrentRateDto[],
    tagToRate: StringToNumObj,
  ): void {

    posts.forEach((post) => {
      const oneTagRate: number = this.getOneTagRate(post);

      post.entity_tags.forEach((title: string) => {
        if (!tagToRate[title]) {
          tagToRate[title] = 0;
        }

        tagToRate[title] += oneTagRate;
      });
    });
  }

  private static getOneTagRate(post: TagCurrentRateDto): number {
    return +(post.current_rate / post.entity_tags.length).toFixed(10);
  }
}

export = TagsCurrentRateProcessor;
