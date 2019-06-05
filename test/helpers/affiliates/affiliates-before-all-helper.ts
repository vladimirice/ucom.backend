import { UserModel } from '../../../lib/users/interfaces/model-interfaces';

import AffiliatesGenerator = require('../../generators/affiliates/affiliates-generator');
import StreamsCreatorService = require('../../../lib/affiliates/service/streams-creator-service');
import RedirectRequest = require('./redirect-request');
import OffersModel = require('../../../lib/affiliates/models/offers-model');

class AffiliatesBeforeAllHelper {
  public static async beforeAll(
    postAuthor: UserModel,
    userSourceDisturbance: UserModel,
  ): Promise<{ offer: OffersModel }> {
    const { offer } = await AffiliatesGenerator.createPostAndOffer(postAuthor);

    await StreamsCreatorService.createRegistrationStreamsForEverybody(offer);

    // Disturbance
    const { uniqueId: firstUniqueId } = await RedirectRequest.makeRedirectRequest(userSourceDisturbance, offer);
    const { uniqueId: secondUniqueId } = await RedirectRequest.makeRedirectRequest(userSourceDisturbance, offer);

    await Promise.all([
      RedirectRequest.makeRedirectRequest(userSourceDisturbance, offer, firstUniqueId),
      RedirectRequest.makeRedirectRequest(userSourceDisturbance, offer, secondUniqueId),
    ]);

    return {
      offer,
    };
  }
}

export = AffiliatesBeforeAllHelper;
