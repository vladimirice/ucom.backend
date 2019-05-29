import moment = require('moment');

import { UserModel } from '../../../lib/users/interfaces/model-interfaces';
import OffersModel = require('../../../lib/affiliates/models/offers-model');
import DatetimeHelper = require('../../../lib/common/helper/datetime-helper');
import PostsGenerator = require('../../generators/posts-generator');
import AffiliatesAttributionIdsDictionary = require('../../../lib/affiliates/dictionary/affiliates-attribution-ids-dictionary');
import NotificationsEventIdDictionary = require('../../../lib/entities/dictionary/notifications-event-id-dictionary');
import AffiliatesParticipationIdsDictionary = require('../../../lib/affiliates/dictionary/affiliates-participation-ids-dictionary');
import ProcessStatusesDictionary = require('../../../lib/common/dictionary/process-statuses-dictionary');

class AffiliatesGenerator {
  public static async createPostAndOffer(user: UserModel): Promise<{offer: OffersModel, postId: number}> {
    const startedAt   = DatetimeHelper.getMomentInUtcString(moment().subtract(2, 'days'));
    const finishedAt  = DatetimeHelper.getMomentInUtcString(moment().add(14, 'days'));

    const postId: number = await PostsGenerator.createMediaPostByUserHimself(user);

    const toInsert = {
      started_at: startedAt,
      finished_at: finishedAt,

      post_id: postId,
      status: ProcessStatusesDictionary.new(),
      title: 'Sample offer for tests',
      attribution_id: AffiliatesAttributionIdsDictionary.firstWins(),
      event_id: NotificationsEventIdDictionary.getRegistration(),
      participation_id: AffiliatesParticipationIdsDictionary.all(),
      url_template: 'sample_template',
    };

    const offer: OffersModel = await OffersModel.query()
      .insert(toInsert);

    return {
      offer,
      postId,
    }
  }
}

export = AffiliatesGenerator;
