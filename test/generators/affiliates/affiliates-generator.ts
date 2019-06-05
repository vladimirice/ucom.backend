import { UserModel } from '../../../lib/users/interfaces/model-interfaces';

import moment = require('moment');
import OffersModel = require('../../../lib/affiliates/models/offers-model');
import DatetimeHelper = require('../../../lib/common/helper/datetime-helper');
import PostsGenerator = require('../../generators/posts-generator');
import OffersCreatorService = require('../../../lib/affiliates/service/offers-creator-service');

class AffiliatesGenerator {
  public static async createPostAndOffer(user: UserModel): Promise<{offer: OffersModel, postId: number}> {
    const startedAt   = DatetimeHelper.getMomentInUtcString(moment().subtract(2, 'days'));
    const finishedAt  = DatetimeHelper.getMomentInUtcString(moment().add(14, 'days'));

    const title = 'sample offer';

    const postId: number =
      await PostsGenerator.createMediaPostByUserHimself(user);
    const offer: OffersModel =
      await OffersCreatorService.createOfferForRegistration(title, postId, startedAt, finishedAt);

    return {
      offer,
      postId,
    };
  }
}

export = AffiliatesGenerator;
