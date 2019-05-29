import { BadRequestError } from '../../api/errors';
import OffersModel = require('../models/offers-model');
import StreamsModel = require('../models/streams-model');

class RedirectService {
  public static async process(request: any) {
    const {offerHash, streamIdentity} = this.extractParams(request);

    const [offer, stream] = await Promise.all([
      OffersModel.query().findOne({ hash: offerHash }),
      StreamsModel.query().findOne({ account_name: streamIdentity }),
    ]);

    if (!offer) {
      throw new BadRequestError(`There is no offer with a hash ${offerHash}`);
    }

    if (!stream) {
      throw new BadRequestError(`There is no stream with identity ${streamIdentity}`);
    }
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
