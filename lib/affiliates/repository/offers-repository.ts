import { AppError } from '../../api/errors';

import OffersModel = require('../models/offers-model');

const { EventsIds } = require('ucom.libs.common').Events.Dictionary;

class OffersRepository {
  // #task - this is a method to self-document a code about current business situation
  public static async getRegistrationOffer(): Promise<OffersModel> {
    const data = await OffersModel.query().where('event_id', EventsIds.registration());

    if (!data) {
      throw new AppError('It is required to create an offer beforehand');
    }

    if (data.length !== 1) {
      throw new AppError('It is required to create only one offer for the registration event');
    }

    return data[0];
  }
}

export = OffersRepository;
