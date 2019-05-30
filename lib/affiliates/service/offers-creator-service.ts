import OffersModel = require('../models/offers-model');
import ProcessStatusesDictionary = require('../../common/dictionary/process-statuses-dictionary');
import AffiliatesAttributionIdsDictionary = require('../dictionary/affiliates-attribution-ids-dictionary');
import NotificationsEventIdDictionary = require('../../entities/dictionary/notifications-event-id-dictionary');
import AffiliatesParticipationIdsDictionary = require('../dictionary/affiliates-participation-ids-dictionary');

const config = require('config');

class OffersCreatorService {
  public static async createOfferForRegistration(
    title: string,
    postId: number,
    startedAt: string,
    finishedAt: string | null = null,
  ): Promise<OffersModel> {
    const toInsert = {
      started_at: startedAt,
      finished_at: finishedAt,

      post_id: postId,
      status: ProcessStatusesDictionary.new(),
      title: title,
      attribution_id: AffiliatesAttributionIdsDictionary.firstWins(),
      event_id: NotificationsEventIdDictionary.getRegistration(),
      participation_id: AffiliatesParticipationIdsDictionary.all(),
      redirect_url_template: `${config.servers.redirect}`,
    };

    const offer: OffersModel = await OffersModel.query()
      .insert(toInsert);

    const redirectUrlTemplate = `${config.servers.redirect}/${offer.hash}/{account_name}`;

    await offer
      .$query()
      .patch({
        redirect_url_template: redirectUrlTemplate
      });

    return offer;
  }
}

export = OffersCreatorService;
