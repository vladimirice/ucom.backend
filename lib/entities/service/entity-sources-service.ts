/* eslint-disable you-dont-need-lodash-underscore/filter */
/* tslint:disable:max-line-length */
import EntityModelProvider = require('./entity-model-provider');
import EntityInputProcessor = require('../validator/entity-input-processor');
import DeleteAllInArrayValidator = require('../../common/validator/form-data/delete-all-in-array-validator');
import EntitySourcesRepository = require('../repository/entity-sources-repository');
import EntitySourcesDictionary = require('../dictionary/entity-sources-dictionary');

const _ = require('lodash');

const models = require('../../../models');

const TABLE_NAME = EntityModelProvider.getSourcesTableName();
const repository = require('../repository').Sources;
// tslint:disable-next-line
const UpdateManyToManyHelper = require('../../api/helpers/UpdateManyToManyHelper');
const entityModelProvider = require('./entity-model-provider');
const { CreateEntitySourceSchema, UpdateEntitySourceSchema } = require('../../entities/validator/validator-create-update-entity-source-schema');
const { BadRequestError } = require('../../api/errors');
const usersRepository = require('../../users/repository').Main;
const orgRepository = require('../../organizations/repository').Main;

const usersModelProvider = require('../../users/users-model-provider');
const orgModelProvider = require('../../organizations/service/organizations-model-provider');
const orgPostProcessor = require('../../organizations/service/organization-post-processor');

// #task - provide dictionary
const sourceTypes: any = {
  social_networks: {
    source_group_id : EntitySourcesDictionary.socialNetworksGroup(),
    body_key        : 'social_networks',
  },
  community_sources: {
    source_group_id : EntitySourcesDictionary.communityGroup(),
    body_key        : 'community_sources',
  },
  partnership_sources: {
    source_group_id : EntitySourcesDictionary.partnershipGroup(),
    body_key        : 'partnership_sources',
  },
};

class EntitySourceService {
  /**
   *
   * @param {number} entityId
   * @param {string} entityName
   * @param {Object[]} body - request body
   * @param {Object} transaction
   */
  public static async processCreationRequest(entityId, entityName, body, transaction) {
    // #task - validate request by Joi


    for (const source in sourceTypes) {
      if (!sourceTypes.hasOwnProperty(source)) {
        continue;
      }

      let entities = body[source];

      if (!entities) {
        continue;
      }

      entities = _.filter(entities);
      if (_.isEmpty(entities)) {
        continue;
      }

      EntityInputProcessor.processManyEntitySources(entities);

      const sourceSet = sourceTypes[source];

      let toInsert = [];
      if (sourceSet.source_group_id === EntitySourcesDictionary.socialNetworksGroup()) {
        toInsert = this.getDataForSocialNetworks(entityId, entityName, entities, sourceSet);
      } else {
        toInsert = this.getDataForCommunityAndPartnership(entityId, entityName, entities, sourceSet);
      }

      await models[TABLE_NAME].bulkCreate(toInsert, { transaction });
    }

    return true;
  }

  /**
   *
   * @param {number} entityId
   * @param {string} entityName
   * @param {Object} body
   * @param {Object} transaction
   * @return {Promise<void>}
   */
  public static async processSourcesUpdating(
    entityId,
    entityName,
    body,
    transaction,
  ) {
    for (const sourceType in sourceTypes) {
      if (!sourceTypes.hasOwnProperty(sourceType)) {
        continue;
      }

      const sourceTypeSet = sourceTypes[sourceType];
      const sources = body[sourceType];

      if (!sources) {
        continue;
      }

      if (DeleteAllInArrayValidator.isValueMeanDeleteAll(sources)) {
        // #task - process inside transaction
        await EntitySourcesRepository.deleteAllForOrgBySourceTypeId(
          entityId,
          entityName,
          sourceTypeSet.source_group_id,
        );

        continue;
      }

      await this.processOneSourceKey(entityId, entityName, body, sourceType, sourceTypeSet.source_group_id, transaction);
    }
  }

  /**
   *
   * @param {number} entityId
   * @param {string} entityName
   * @return {Promise<void>}
   */
  public static async findAndGroupAllEntityRelatedSources(entityId, entityName) {
    // #task - entity name allowed values - provide dictionary
    const sources = await repository.findAllEntityRelatedSources(entityId, entityName);

    const result = {
      social_networks: [],
      community_sources: [],
      partnership_sources: [],
    };

    /*
      if internal source then fetch for this model and provide universal field set + id of record
      if external source then provide basic set of fields as for creation + id of record
     */

    for (const source of sources) {
      const group = EntitySourcesDictionary.sourceGroupIdToStringKey(source.source_group_id);
      let toPush: any = {};

      if (source.source_group_id === EntitySourcesDictionary.socialNetworksGroup()) {
        toPush = source;
        // #task - restrict output. Only required fields
      } else if (source.source_entity_id !== null) {
        toPush = await this.fillInternalSource(source);
      } else {
        toPush = this.fillExternalSource(source);
      }

      result[group].push(toPush);
    }

    return result;
  }

  /**
   * @param {Object} source
   * @return {Object}
   * @private
   */
  private static fillExternalSource(source) {
    const json = JSON.parse(source.text_data);

    return {
      id:           source.id,

      title:        json.title || '',
      description:  json.description || '',
      source_url:   source.source_url,

      avatar_filename: source.avatar_filename ? `organizations/${source.avatar_filename}` : null,
      source_type: 'external',
    };
  }

  /**
   *
   * @param {Object} source
   * @return {Promise<Object>}
   * @private
   */
  private static async fillInternalSource(source) {
    let entity;
    let processedTitle;

    switch (source.source_entity_name) {
      case orgModelProvider.getEntityName():
        entity = await orgRepository.findOnlyItselfById(source.source_entity_id); // #task - use JOIN
        processedTitle = entity.title;
        orgPostProcessor.processOneOrg(entity);
        break;
      case usersModelProvider.getEntityName():
        entity = await usersRepository.findOnlyItselfById(source.source_entity_id);
        processedTitle = `${entity.first_name} ${entity.last_name}`;
        break;
      default:
        // do nothing
        break;
    }

    if (!entity) {
      // #task - log error, this is inconsistency
      return null;
    }

    return {
      title:            processedTitle,
      id:               source.id,
      entity_name:      source.source_entity_name,

      entity_id:        source.source_entity_id,
      avatar_filename:  entity.avatar_filename,
      nickname:         entity.nickname,

      source_type:      'internal',
    };
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
  private static getDataForCommunityAndPartnership(parentEntityId, parentEntityName, sources, sourceSet) {
    const result: any = [];

    sources.forEach((source) => {
      if (source.source_type === EntitySourcesDictionary.internalType()) {
        result.push({
          source_url:         '',
          is_official:        false,
          source_type_id:     null,

          source_group_id:    sourceSet.source_group_id,

          entity_id:          parentEntityId,
          entity_name:        parentEntityName,

          source_entity_id:   +source.entity_id, // #task - validate consistency
          source_entity_name: source.entity_name, // #task - filter, only concrete collection is allowed

          text_data: '',
        });
      } else if (source.source_type === EntitySourcesDictionary.externalType()) {
        const textDataJson = {
          title:        source.title || '',
          description:  source.description || '',
        };

        result.push({
          source_url:         source.source_url,
          is_official:        false,
          source_type_id:     null,

          source_group_id:    sourceSet.source_group_id,
          entity_id:          parentEntityId,
          entity_name:        parentEntityName,

          text_data: JSON.stringify(textDataJson),
          avatar_filename: source.avatar_filename,
        });
      } else {
        throw new BadRequestError({
          source_type :
            `Source type ${source.source_type} is not supported. Only ${EntitySourcesDictionary.internalType()} or ${EntitySourcesDictionary.externalType()}`,
        });
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
  private static getDataForSocialNetworks(parentEntityId, parentEntityName, sources, sourceSet) {
    const result: any = [];

    const appendData = {
      source_group_id:  sourceSet.source_group_id,
      entity_id:        parentEntityId,
      entity_name:      parentEntityName,
    };

    sources.forEach((entity) => {
      result.push({
        ...entity,
        ...appendData,
      });
    });

    return result;
  }

  // noinspection OverlyComplexFunctionJS
  private static async processOneSourceKey(entityId, entityName, body, sourceKey, sourceGroupId, transaction) {
    const updatedModels = _.filter(body[sourceKey]);
    if (!updatedModels || _.isEmpty(updatedModels)) {
      // #task - NOT possible to remove all users because of this. Wil be fixed later
      return null;
    }
    EntityInputProcessor.processManyEntitySources(updatedModels);

    const sourceData  = await repository.findAllRelatedToEntityWithGroupId(entityId, entityName, sourceGroupId);
    const deltaData   = UpdateManyToManyHelper.getCreateUpdateDeleteDelta(sourceData, updatedModels);

    if (sourceGroupId === EntitySourcesDictionary.socialNetworksGroup()) {
      UpdateManyToManyHelper.filterDeltaDataBeforeSave(deltaData, CreateEntitySourceSchema, UpdateEntitySourceSchema);
    } else {
      this.processExternalTextDataBeforeSave(deltaData.added);
      this.processExternalTextDataBeforeSave(deltaData.changed);
    }

    const appendDataForNew = {
      entity_id: entityId,
      entity_name: entityName,
      source_group_id: sourceGroupId,
    };

    return UpdateManyToManyHelper.updateSourcesByDelta(
      entityModelProvider.getSourcesModel(),
      deltaData,
      appendDataForNew,
      transaction,
    );
  }

  private static processExternalTextDataBeforeSave(manyModels) {
    manyModels.forEach((model) => {
      if (model.source_type === 'external') {
        const json = {
          title: model.title || '',
          description: model.description || '',
        };

        // Prevent from filename changing without file uploading
        if (model.avatar_filename_from_file !== true) {
          delete model.avatar_filename;
        }

        model.text_data = JSON.stringify(json);
      } else {
        model.source_entity_id = model.entity_id;
        model.source_entity_name = model.entity_name;

        delete model.entity_id;
        delete model.entity_name;
      }
    });
  }
}

export = EntitySourceService;
