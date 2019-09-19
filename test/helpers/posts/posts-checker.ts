import { CheckerOptions } from '../../generators/interfaces/dto-interfaces';

import UsersHelper = require('../../integration/helpers/users-helper');
import CommonHelper = require('../../integration/helpers/common-helper');

class PostsChecker {
  public static checkOnePostWithTwoComments(post, commentOne, commentTwo, isMyself: boolean): void {
    const { comments } = post;

    expect(comments.data.length).toBe(2);
    expect(comments.data.some((item) => item.id === commentOne.id)).toBeTruthy();
    expect(comments.data.some((item) => item.id === commentTwo.id)).toBeTruthy();

    const options: CheckerOptions = {
      myselfData    : isMyself,
      postProcessing: 'full',
      comments: {
        isEmpty: false,
      },
      ...UsersHelper.propsAndCurrentParamsOptions(true),
    };

    CommonHelper.checkOnePostV2(post, options);
  }
}

export = PostsChecker;
