"use strict";
/* eslint-disable no-console */
/* tslint:disable:max-line-length */
const entity_event_repository_1 = require("../repository/entity-event-repository");
const JsonValueService = require("./json-value-service");
const PostsJobParams = require("../job-params/posts-job-params");
const OrgsJobParams = require("../job-params/orgs-job-params");
const TagsJobParams = require("../job-params/tags-job-params");
const RepositoryHelper = require("../../common/repository/repository-helper");
const StatsFetchCalculation = require("./fetch/stats-fetch-calculation");
const EnvHelper = require("../../common/helper/env-helper");
// @ts-ignore
const UsersJobParams = require("../job-params/users-job-params");
const profilingInfo = {};
class EntityCalculationService {
    static async updateEntitiesDeltas() {
        const entitiesSets = [
            PostsJobParams.getOneToOneSet(),
            OrgsJobParams.getOneToOneSet(),
            TagsJobParams.getOneToOneSet(),
            UsersJobParams.getOneToOneSet(),
        ];
        for (const set of entitiesSets) {
            for (const params of set) {
                try {
                    console.log(`Let's process entity ${params.entityName} and calculate a ${params.resultEventType}`);
                    await this.processOneToOne(params);
                }
                catch (error) {
                    if (error.message === 'LastData array is empty' && EnvHelper.isTestEnv()) {
                        continue;
                    }
                    throw error;
                }
            }
        }
    }
    static async processOneToOne(params) {
        const hrstart = process.hrtime();
        this.printMemoryUsage('before_start');
        const [lastData, lastOfGivenDateData] = await StatsFetchCalculation.findStatsData(params);
        const totalFetchedAmount = lastData.length + lastOfGivenDateData.length;
        if (process.env.NODE_ENV !== 'test') {
            console.log(`Total amount: ${totalFetchedAmount}. Last data length: ${lastData.length}. lastOfGivenDateData length: ${lastOfGivenDateData.length}`);
        }
        const hrend = process.hrtime(hrstart);
        if (process.env.NODE_ENV !== 'test') {
            console.log(`Db fetch time: ${hrend[1] / 1000000} ms`);
        }
        this.printMemoryUsage('after_db_fetching', false);
        this.printMemoryDiff('after_db_fetching', 'before_start');
        const toProcess = this.prepareDeltaDataToProcess(lastData, params.paramField, params.isFloat);
        this.calculateDeltaValue(toProcess, lastOfGivenDateData, params.paramField, params.isFloat);
        // Here we have required delta parameter for every entity
        await this.createImportanceDeltaEvents(params, toProcess);
        if (params.currentParams) {
            const updateParams = {
                tableName: params.currentParams.tableName,
                fieldNameToSet: params.currentParams.fieldNameToSet,
                whenFieldName: params.currentParams.whenFieldName,
                thenFieldNameFromSet: 'delta_value',
            };
            await RepositoryHelper.updateManyRowsByNumberToNumber(toProcess, updateParams);
        }
        this.printMemoryUsage('after_to_process_filling', false);
        this.printMemoryDiff('after_to_process_filling', 'after_db_fetching');
    }
    static prepareDeltaDataToProcess(lastData, paramField, isFloat) {
        if (lastData.length === 0) {
            throw new Error('LastData array is empty');
        }
        const toProcess = {};
        for (const current of lastData) {
            if (toProcess[current.entity_id]) {
                throw new Error(`There is toProcess already for ${current.entity_id}. There are duplications in requests`);
            }
            let lastValue = current.json_value.data[paramField];
            if (isFloat) {
                lastValue = +lastValue.toFixed(10);
            }
            toProcess[current.entity_id] = {
                entity_id: current.entity_id,
                entity_blockchain_id: current.entity_blockchain_id,
                entity_name: current.entity_name,
                first_value: 0,
                last_value: lastValue,
                delta_value: lastValue,
            };
        }
        return toProcess;
    }
    static calculateDeltaValue(toProcess, lastOfGivenDateData, paramField, isFloat) {
        if (lastOfGivenDateData.length === 0) {
            throw new Error(`lastOfGivenDateData is empty. Param field: ${JSON.stringify(paramField)}`);
        }
        for (const current of lastOfGivenDateData) {
            const related = toProcess[current.entity_id];
            if (!related) {
                console.error(`There is no such ${current.entity_id} in lastData. Lets think that rate is disappeared. Skipping...`);
                continue;
            }
            if (current.json_value.data[paramField] < 0) {
                throw new Error(`Importance value is negative for entity ${JSON.stringify(current)}`);
            }
            related.first_value = current.json_value.data[paramField];
            if (isFloat) {
                related.first_value = +related.first_value.toFixed(10);
            }
            related.delta_value = +related.last_value - related.first_value;
            if (isFloat) {
                related.delta_value = +related.delta_value.toFixed(10);
            }
        }
    }
    static async createImportanceDeltaEvents(params, toProcess) {
        const events = [];
        for (const entityId in toProcess) {
            if (!toProcess.hasOwnProperty(entityId)) {
                continue;
            }
            const stats = toProcess[entityId];
            const resultValue = stats.delta_value;
            const payload = {
                [params.paramFieldDelta]: stats.delta_value,
            };
            const description = `${params.description} with window of ${params.windowIntervalHours} hours`;
            events.push({
                entity_id: +entityId,
                entity_blockchain_id: stats.entity_blockchain_id,
                entity_name: params.entityName,
                event_type: params.resultEventType,
                event_group: params.eventGroup,
                event_super_group: params.eventSuperGroup,
                json_value: JsonValueService.getJsonValueParameter(description, payload),
                result_value: resultValue,
            });
        }
        await entity_event_repository_1.EntityEventRepository.insertManyEvents(events);
    }
    static printMemoryDiff(toLabel, fromLabel) {
        if (process.env.NODE_ENV === 'test') {
            return;
        }
        const memoryTo = profilingInfo[toLabel];
        const memoryFrom = profilingInfo[fromLabel];
        const res = {};
        for (const key in memoryTo) {
            if (!memoryTo.hasOwnProperty(key)) {
                continue;
            }
            res[key] = `${+memoryTo[key].replace(' MB', '') - +memoryFrom[key].replace(' MB', '')} MB`;
        }
        console.log(`${toLabel} minus ${fromLabel} is: ${JSON.stringify(res, null, 2)}`);
    }
    static printMemoryUsage(label, toPrint = true) {
        if (process.env.NODE_ENV === 'test') {
            return;
        }
        const usedFormatted = {};
        const used = process.memoryUsage();
        for (const key in used) {
            if (!used.hasOwnProperty(key)) {
                continue;
            }
            usedFormatted[key] = `${Math.round(used[key] / 1024 / 1024 * 100) / 100} MB`;
        }
        profilingInfo[label] = usedFormatted;
        if (toPrint) {
            console.log(`${label}: ${JSON.stringify(usedFormatted, null, 2)}`);
        }
    }
}
module.exports = EntityCalculationService;
