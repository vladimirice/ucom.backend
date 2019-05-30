import { BadRequestError } from '../../api/errors';
import OffersModel = require('../models/offers-model');
import StreamsModel = require('../models/streams-model');
import ClicksModel = require('../models/clicks-model');
import AffiliateUniqueIdService = require('./affiliate-unique-id-service');

class RedirectService {
  public static async process(request: any, response: any): Promise<StreamsModel> {
    const uniqueId: string = AffiliateUniqueIdService.processUniqIdCookie(request, response);

    const {offerHash, streamIdentity} = this.extractParams(request);
    const [offer, stream] = await Promise.all([
      OffersModel.query().findOne({ hash: offerHash }),
      // #task hardcode - in the future identity might be not only account_name
      StreamsModel.query().findOne({ account_name: streamIdentity }),
    ]);

    if (!offer) {
      throw new BadRequestError(`There is no offer with a hash ${offerHash}`);
    }

    if (!stream) {
      throw new BadRequestError(`There is no stream with identity ${streamIdentity}`);
    }

    await ClicksModel.query()
      .insert({
        offer_id:       stream.offer_id,
        stream_id:      stream.id,
        user_unique_id: uniqueId,
        json_headers:   request.headers,
        referer:        request.referer || '',
      });

    return stream;
  }

  private static extractParams(req: any) {
    if (!req.params.offerHash) {
      throw new BadRequestError(`Offer hash is not provided`);
    }

    if (!req.params.streamIdentity) {
      throw new BadRequestError(`stream identity is not provided`);
    }

    return {
      offerHash:      req.params.offerHash,
      streamIdentity: req.params.streamIdentity,
    }
  }
}

export = RedirectService;
