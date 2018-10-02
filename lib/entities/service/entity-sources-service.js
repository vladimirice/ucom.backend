const _ = require('lodash');

const models = require('../../../models');
const TABLE_NAME = 'entity_sources'; // TODO - use ModelProvider
const Repository = require('../repository').Sources;
const UpdateManyToManyHelper = require('../../api/helpers/UpdateManyToManyHelper');
const EntityModelProvider = require('./entity-model-provider');
const { CreateEntitySourceSchema, UpdateEntitySourceSchema} = require('../../entities/validator/validator-create-update-entity-source-schema');
const { BadRequestError } = require('../../api/errors');



const SOURCE_GROUP__SOCIAL_NETWORKS = 1;
const SOURCE_GROUP__COMMUNITY       = 2;
const SOURCE_GROUP__PARTNERSHIP     = 3;

const SOURCE_TYPE__INTERNAL = 'internal';
const SOURCE_TYPE__EXTERNAL = 'external';

const sourceTypes = {
  'social_networks': {
    'source_group_id' : SOURCE_GROUP__SOCIAL_NETWORKS,
    'body_key'        : 'social_networks',
  },
  'community_sources': {
    'source_group_id' : SOURCE_GROUP__COMMUNITY,
    'body_key'        : 'community_sources'
  },
  'partnership_sources': {
    'source_group_id' : SOURCE_GROUP__PARTNERSHIP,
    'body_key'        : 'partnership_sources'
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

    // How to write down these sources

    // internal source - must be fetched as preview
    // external resource - must be fetched as full another set

    const a = 0;
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

      // Here is required to split to external and internal

      let toInsert = [];
      if (sourceSet.source_group_id === SOURCE_GROUP__SOCIAL_NETWORKS) {
        toInsert = this._getDataForSocialNetworks(entity_id, entity_name, entities, sourceSet);
      } else {
        toInsert = this._getDataForCommunityAndPartnership(entity_id, entity_name, entities, sourceSet);
      }

      // TODO Use promises because of kinds of sources
      await models[TABLE_NAME].bulkCreate(toInsert, { transaction });
    }

    return true;
  }

  /**
   *
   * @param {number} entity_id
   * @param {string} entity_name
   * @param {Object} data
   * @param {Object} transaction
   * @return {Promise<void>}
   */
  static async processSourcesUpdating(
    entity_id,
    entity_name,
    data,
    transaction
  ) {

    const sourceKey = 'social_networks'; // TODO - provide array iteration
    const source_group_id = 1; // TODO dictionary

    return await this._processOneSourceKey(entity_id, entity_name, data, sourceKey, source_group_id, transaction);
  }

  /**
   *
   * @param {number} parentEntityId
   * @param {string} parentEntityName
   * @param {Object[]} sources
   * @param {Object} sourceSet
   * @return {Object[]}
   * @private
   */
  static _getDataForCommunityAndPartnership(parentEntityId, parentEntityName, sources, sourceSet) {
    let result = [];

    sources.forEach(source => {
      if (source.source_type === SOURCE_TYPE__INTERNAL) {
        result.push({
          source_url:         '',
          is_official:        false,
          source_type_id:     null,

          source_group_id:    sourceSet['source_group_id'],

          entity_id:          parentEntityId,
          entity_name:        parentEntityName,

          source_entity_id:   +source.id, // TODO - validate consistency
          source_entity_name: source['entity_name'], // TODO - filter, only concrete collection is allowed

          text_data: '',
        });
      } else if(source.source_type === SOURCE_TYPE__EXTERNAL) {
        const textDataJson = {
          title:        source.title || '',
          description:  source.description || '',
        };

        result.push({
          source_url:         source.source_url,
          is_official:        false,
          source_type_id:     null,

          source_group_id:    sourceSet['source_group_id'],
          entity_id:          parentEntityId,
          entity_name:        parentEntityName,

          text_data: JSON.stringify(textDataJson),
        });
      } else {
        throw new BadRequestError({
          'source_type' :
            `Source type ${source.source_type} is not supported. Only ${SOURCE_TYPE__INTERNAL} or ${SOURCE_TYPE__EXTERNAL}`}
        );
      }
    });

    return result;
  }

  /**
   *
   * @param {number} parentEntityId
   * @param {string} parentEntityName
   * @param {Object[]} sources
   * @param {Object} sourceSet
   * @return {Object[]}
   * @private
   */
  static _getDataForSocialNetworks(parentEntityId, parentEntityName, sources, sourceSet) {
    let result = [];

    const appendData = {
      source_group_id:  sourceSet['source_group_id'],
      entity_id:        parentEntityId,
      entity_name:      parentEntityName
    };

    sources.forEach(entity => {
      result.push({
        ...entity,
        ...appendData
      });
    });

    return result;
  }

  // noinspection OverlyComplexFunctionJS
  static async _processOneSourceKey(entity_id, entity_name, data, key, source_group_id, transaction) {
    let updatedModels = _.filter(data[key]);
    if (!updatedModels || _.isEmpty(updatedModels)) {
      // TODO NOT possible to remove all users because of this. Wil be fixed later
      return null;
    }

    const sourceData  = await Repository.findAllRelatedToEntityWithGroupId(entity_id, entity_name, source_group_id);
    const deltaData   = UpdateManyToManyHelper.getCreateUpdateDeleteDelta(sourceData, updatedModels);

    UpdateManyToManyHelper.filterDeltaDataBeforeSave(deltaData, CreateEntitySourceSchema, UpdateEntitySourceSchema);

    const appendDataForNew = {
      entity_id,
      entity_name,
      source_group_id,
    };

    return UpdateManyToManyHelper.updateSourcesByDelta(
      EntityModelProvider.getSourcesModel(),
      deltaData,
      appendDataForNew,
      transaction
    );
  }
}

module.exports = EntitySourceService;