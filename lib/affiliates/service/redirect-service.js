"use strict";
const errors_1 = require("../../api/errors");
const OffersModel = require("../models/offers-model");
const StreamsModel = require("../models/streams-model");
const ClicksModel = require("../models/clicks-model");
const AffiliateUniqueIdService = require("./affiliate-unique-id-service");
class RedirectService {
    static async process(request, response) {
        const uniqueId = AffiliateUniqueIdService.processUniqIdCookie(request, response);
        const { offerHash, streamIdentity } = this.extractParams(request);
        const [offer, stream] = await Promise.all([
            OffersModel.query().findOne({ hash: offerHash }),
            // #task hardcode - in the future identity might be not only account_name
            StreamsModel.query().findOne({ account_name: streamIdentity }),
        ]);
        if (!offer) {
            throw new errors_1.BadRequestError(`There is no offer with a hash ${offerHash}`);
        }
        if (!stream) {
            throw new errors_1.BadRequestError(`There is no stream with identity ${streamIdentity}`);
        }
        await ClicksModel.query()
            .insert({
            offer_id: stream.offer_id,
            stream_id: stream.id,
            user_unique_id: uniqueId,
            json_headers: request.headers,
            referer: request.referer || '',
        });
        return stream;
    }
    static extractParams(req) {
        if (!req.params.offerHash) {
            throw new errors_1.BadRequestError(`Offer hash is not provided`);
        }
        if (!req.params.streamIdentity) {
            throw new errors_1.BadRequestError(`stream identity is not provided`);
        }
        return {
            offerHash: req.params.offerHash,
            streamIdentity: req.params.streamIdentity,
        };
    }
}
module.exports = RedirectService;
