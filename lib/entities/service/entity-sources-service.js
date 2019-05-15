"use strict";
/* eslint-disable you-dont-need-lodash-underscore/filter */
/* tslint:disable:max-line-length */
const EntityModelProvider = require("./entity-model-provider");
const EntityInputProcessor = require("../validator/entity-input-processor");
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
const SOURCE_GROUP__SOCIAL_NETWORKS = 1;
const SOURCE_GROUP__COMMUNITY = 2;
const SOURCE_GROUP__PARTNERSHIP = 3;
const SOURCE_TYPE__INTERNAL = 'internal';
const SOURCE_TYPE__EXTERNAL = 'external';
// #task - provide dictionary
const sourceTypes = {
    social_networks: {
        source_group_id: SOURCE_GROUP__SOCIAL_NETWORKS,
        body_key: 'social_networks',
    },
    community_sources: {
        source_group_id: SOURCE_GROUP__COMMUNITY,
        body_key: 'community_sources',
    },
    partnership_sources: {
        source_group_id: SOURCE_GROUP__PARTNERSHIP,
        body_key: 'partnership_sources',
    },
};
const sourceGroupIdToType = {
    1: 'social_networks',
    2: 'community_sources',
    3: 'partnership_sources',
};
class EntitySourceService {
    /**
     *
     * @param {number} entityId
     * @param {string} entityName
     * @param {Object[]} body - request body
     * @param {Object} transaction
     */
    static async processCreationRequest(entityId, entityName, body, transaction) {
        // #task - validate request by Joi
        EntityInputProcessor.processEntitySources(body);
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
            const sourceSet = sourceTypes[source];
            let toInsert = [];
            if (sourceSet.source_group_id === SOURCE_GROUP__SOCIAL_NETWORKS) {
                toInsert = this.getDataForSocialNetworks(entityId, entityName, entities, sourceSet);
            }
            else {
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
    static async processSourcesUpdating(entityId, entityName, body, transaction) {
        EntityInputProcessor.processEntitySources(body);
        for (const sourceType in sourceTypes) {
            if (!sourceTypes.hasOwnProperty(sourceType)) {
                continue;
            }
            const sourceTypeSet = sourceTypes[sourceType];
            const sources = body[sourceType];
            if (sources) {
                await this.processOneSourceKey(entityId, entityName, body, sourceType, sourceTypeSet.source_group_id, transaction);
            }
        }
    }
    /**
     *
     * @param {number} entityId
     * @param {string} entityName
     * @return {Promise<void>}
     */
    static async findAndGroupAllEntityRelatedSources(entityId, entityName) {
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
            const group = sourceGroupIdToType[source.source_group_id];
            let toPush = {};
            if (source.source_group_id === SOURCE_GROUP__SOCIAL_NETWORKS) {
                toPush = source;
                // #task - restrict output. Only required fields
            }
            else if (source.source_entity_id !== null) {
                toPush = await this.fillInternalSource(source);
            }
            else {
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
    static fillExternalSource(source) {
        const json = JSON.parse(source.text_data);
        return {
            id: source.id,
            title: json.title || '',
            description: json.description || '',
            source_url: source.source_url,
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
    static async fillInternalSource(source) {
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
            title: processedTitle,
            id: source.id,
            entity_name: source.source_entity_name,
            entity_id: source.source_entity_id,
            avatar_filename: entity.avatar_filename,
            nickname: entity.nickname,
            source_type: 'internal',
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
    static getDataForCommunityAndPartnership(parentEntityId, parentEntityName, sources, sourceSet) {
        const result = [];
        sources.forEach((source) => {
            if (source.source_type === SOURCE_TYPE__INTERNAL) {
                result.push({
                    source_url: '',
                    is_official: false,
                    source_type_id: null,
                    source_group_id: sourceSet.source_group_id,
                    entity_id: parentEntityId,
                    entity_name: parentEntityName,
                    source_entity_id: +source.entity_id,
                    source_entity_name: source.entity_name,
                    text_data: '',
                });
            }
            else if (source.source_type === SOURCE_TYPE__EXTERNAL) {
                const textDataJson = {
                    title: source.title || '',
                    description: source.description || '',
                };
                result.push({
                    source_url: source.source_url,
                    is_official: false,
                    source_type_id: null,
                    source_group_id: sourceSet.source_group_id,
                    entity_id: parentEntityId,
                    entity_name: parentEntityName,
                    text_data: JSON.stringify(textDataJson),
                    avatar_filename: source.avatar_filename,
                });
            }
            else {
                throw new BadRequestError({
                    source_type: `Source type ${source.source_type} is not supported. Only ${SOURCE_TYPE__INTERNAL} or ${SOURCE_TYPE__EXTERNAL}`,
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
    static getDataForSocialNetworks(parentEntityId, parentEntityName, sources, sourceSet) {
        const result = [];
        const appendData = {
            source_group_id: sourceSet.source_group_id,
            entity_id: parentEntityId,
            entity_name: parentEntityName,
        };
        sources.forEach((entity) => {
            result.push(Object.assign({}, entity, appendData));
        });
        return result;
    }
    // noinspection OverlyComplexFunctionJS
    static async processOneSourceKey(entityId, entityName, data, key, sourceGroupId, transaction) {
        const updatedModels = _.filter(data[key]);
        if (!updatedModels || _.isEmpty(updatedModels)) {
            // #task - NOT possible to remove all users because of this. Wil be fixed later
            return null;
        }
        const sourceData = await repository.findAllRelatedToEntityWithGroupId(entityId, entityName, sourceGroupId);
        const deltaData = UpdateManyToManyHelper.getCreateUpdateDeleteDelta(sourceData, updatedModels);
        if (sourceGroupId === SOURCE_GROUP__SOCIAL_NETWORKS) {
            UpdateManyToManyHelper.filterDeltaDataBeforeSave(deltaData, CreateEntitySourceSchema, UpdateEntitySourceSchema);
        }
        else {
            this.processExternalTextDataBeforeSave(deltaData.added);
            this.processExternalTextDataBeforeSave(deltaData.changed);
        }
        const appendDataForNew = {
            entity_id: entityId,
            entity_name: entityName,
            source_group_id: sourceGroupId,
        };
        return UpdateManyToManyHelper.updateSourcesByDelta(entityModelProvider.getSourcesModel(), deltaData, appendDataForNew, transaction);
    }
    static processExternalTextDataBeforeSave(manyModels) {
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
            }
            else {
                model.source_entity_id = model.entity_id;
                model.source_entity_name = model.entity_name;
                delete model.entity_id;
                delete model.entity_name;
            }
        });
    }
}
module.exports = EntitySourceService;
