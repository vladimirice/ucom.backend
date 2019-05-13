import { BadRequestError } from '../../api/errors';

import EnvHelper = require('./env-helper');

class MaintenanceHelper {
  // #task - delete after airdrop run
  public static hideAirdropsOfferIfRequired(req, postId: number) {
    if (EnvHelper.isNotAProductionEnv()) {
      return;
    }

    const postIdsToHide = [6137, 6530];
    if (!postIdsToHide.includes(postId)) {
      return;
    }

    if (!req.headers) {
      throw new BadRequestError('Not found', 404);
    }

    if (!req.headers.cookie) {
      throw new BadRequestError('Not found', 404);
    }

    if (!req.headers.cookie.includes('test_airdrop=true')) {
      throw new BadRequestError('Not found', 404);
    }
  }
}

export = MaintenanceHelper;
