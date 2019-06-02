"use strict";
const OffersModel = require("../models/offers-model");
const errors_1 = require("../../api/errors");
const { EventsIds } = require('ucom.libs.common').Events.Dictionary;
class OffersRepository {
    // #task - this is a method to self-document a code about current business situation
    static async getRegistrationOffer() {
        const data = await OffersModel.query().where('event_id', EventsIds.registration());
        if (!data) {
            throw new errors_1.AppError('It is required to create an offer beforehand');
        }
        if (data.length !== 1) {
            throw new errors_1.AppError('It is required to create only one offer for the registration event');
        }
        return data[0];
    }
}
module.exports = OffersRepository;
