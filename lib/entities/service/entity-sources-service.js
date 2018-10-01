const _ = require('lodash');

const models = require('../../../models');

const TABLE_NAME = 'entity_sources'; // TODO - use ModelProvider

class EntitySourceService {
  /**
   *
   * @param {number} entity_id
   * @param {string} entity_name
   * @param {number} source_group_id
   * @param {Object[]} body - request body
   * @param {Object} transaction
   */
  static async processCreationRequest(entity_id, entity_name, source_group_id, body, transaction) {
    // TODO - validate request by Joi
    // TODO - sanitize input

    let entities = body[TABLE_NAME];

    if (!entities) {
      return false;
    }

    entities = _.filter(entities);

    if (_.isEmpty(entities)) {
      return false;
    }

    const appendData = {
      source_group_id,
      entity_id,
      entity_name,
    };

    let toInsert = [];
    entities.forEach(async (entity) => {
      toInsert.push({
        ...entity,
        ...appendData
      });
    });

    await models[TABLE_NAME].bulkCreate(toInsert, { transaction });

    return true;
  }
}

module.exports = EntitySourceService;