const _ = require('lodash');

const models = require('../../../models');
const TABLE_NAME = 'entity_sources'; // TODO - use ModelProvider
const Repository = require('../repository').Sources;

const sourceTypes = {
  'social_networks': {
    'source_group_id': 1,
  }
};

const sourceGroupIdToType = {
  1: 'social_networks'
};

class EntitySourceService {
  /**
   *
   * @param {number} entityId
   * @param {string} entityName
   * @return {Promise<void>}
   */
  static async findAndGroupAllEntityRelatedSources(entityId, entityName) {
    // TODO entity name allowed values - provide dictionary
    const sources = await Repository.findAllEntityRelatedSources(entityId, entityName);

    let result = {
      'social_networks': [],
    };


    sources.forEach(source => {
      const group = sourceGroupIdToType[source.source_group_id];

      result[group].push(source);
    });

    return result;
  }

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

    for (const source in sourceTypes) {
      let entities = body[source];
      if (!entities) {
        continue;
      }

      entities = _.filter(entities);
      if (_.isEmpty(entities)) {
        continue;
      }

      const sourceSet = sourceTypes[source];

      const appendData = {
        source_group_id: sourceSet['source_group_id'],
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
    }

    return true;
  }
}

module.exports = EntitySourceService;