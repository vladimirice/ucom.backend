import { BadRequestError } from '../../api/errors';

import EnvHelper = require('./env-helper');

class MaintenanceHelper {
  public static hideAirdropsOfferIfRequired(req, postId: number) {
    if (EnvHelper.isNotAProductionEnv()) {
      return;
    }

    if ((postId === 6137 || postId === 6530) && !req.headers.cookie.includes('test_airdrop=true')) {
      throw new BadRequestError('Not found', 404);
    }
  }
}

export = MaintenanceHelper;
