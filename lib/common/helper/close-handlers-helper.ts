import knex = require('../../../config/knex');
import knexEvents = require('../../../config/knex-events');
const models = require('../../../models');

class CloseHandlersHelper {
  public static async closeDbConnections() {
    await Promise.all([
      knex.destroy(),
      knexEvents.destroy(),

      models.sequelize.close(),
    ]);
  }
}

export = CloseHandlersHelper;
