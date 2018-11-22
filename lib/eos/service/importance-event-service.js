const EntityStatsCurrentRepository = require('../../entities/repository/entity-stats-current-repository');
const EntityEventParamRepository = require('../../entities/repository/entity-event-param-repository');

const PostsRepository = require('../../posts/posts-repository');
const EventTypeDictionary = require('../dictionary/EventTypeDictionary');

const PostsModelProvider = require('../../posts/service/posts-model-provider');

const RATE_DELTA_HOURS_INTERVAL = 30;
const moment = require('moment');

const profilingInfo = {};

class ImportanceEventService {

  static async updateDeltaRateStats() {
    const hrstart = process.hrtime();
    this._printMemoryUsage('before_start');

    const [lastData, lastOfGivenDateData] = await this._findStatsData();

    const totalFetchedAmount = lastData.length + lastOfGivenDateData.length;
    console.log(`Total amount: ${totalFetchedAmount}. Last data length: ${lastData.length}. lastOfGivenDateData length: ${lastOfGivenDateData.length}`);

    const hrend = process.hrtime(hrstart);
    console.log(`Db fetch time: ${hrend[1] / 1000000} ms`);

    this._printMemoryUsage('after_db_fetching', false);
    this._printMemoryDiff('after_db_fetching', 'before_start');

    const { toProcess, entityNameToBlockchainId } = this._prepareBasicToProcess(lastData);

    await this._addEntityIdToData(toProcess, entityNameToBlockchainId);
    this._addRateDelta(toProcess, lastOfGivenDateData);

    await EntityStatsCurrentRepository.upsertImportanceDelta(toProcess);

    this._printMemoryUsage('after_to_process_filling', false);
    this._printMemoryDiff('after_to_process_filling', 'after_db_fetching');
  }

  /**
   *
   * @return {Promise<Object>}
   * @private
   */
  static async _findStatsData() {
    const eventType = EventTypeDictionary.getTypeRateFromBlockchain();

    const newData = moment().subtract(RATE_DELTA_HOURS_INTERVAL, 'hours');
    const createdAtAsString = newData.utc().format('YYYY-MM-DD HH:mm:ss');

    return await Promise.all([
      EntityEventParamRepository.findLastRowsGroupedByEntity(
        `event_type = ${eventType} AND entity_name = ${PostsModelProvider.getEntityName()}`
      ),
      EntityEventParamRepository.findLastRowsGroupedByEntity(
        `"event_type" = ${eventType} AND entity_name = ${PostsModelProvider.getEntityName()} AND created_at < '${createdAtAsString}'`
      )
    ]);
  }


  /**
   *
   * @param {Object[]} lastData
   * @return {{toProcess, entityNameToBlockchainId}}
   * @private
   */
  static _prepareBasicToProcess(lastData) {
    if (lastData.length === 0) {
      throw new Error('LastData array is empty');
    }

    const toProcess = {};
    const entityNameToBlockchainId = {};
    for (let i = 0; i < lastData.length; i++) {
      const current = lastData[i];

      if (toProcess[current.entity_blockchain_id]) {
        throw new Error(`There is toProcess already for ${current.entity_blockchain_id}. There are duplications in requests`);
      }

      if (current.json_value.importance < 0) {
        throw new Error(`Importance value is negative for entity ${JSON.stringify(current)}`);
      }

      toProcess[current.entity_blockchain_id] = {
        entity_blockchain_id: current.entity_blockchain_id,
        entity_name:          current.entity_name,
        last_rate:           +current.json_value.importance.toFixed(10),
        importance_delta:     0,
      };

      if (!entityNameToBlockchainId[current.entity_name]) {
        entityNameToBlockchainId[current.entity_name] = [];
      }

      entityNameToBlockchainId[current.entity_name].push(current.entity_blockchain_id);
    }

    return {
      toProcess,
      entityNameToBlockchainId
    };
  }

  /**
   *
   * @param {Object[]} toProcess
   * @param {Object} entityNameToBlockchainId
   * @private
   */
  static async _addEntityIdToData(toProcess, entityNameToBlockchainId) {
    // Delta for posts only
    const postIds = await PostsRepository.findIdsByBlockchainIds(
      entityNameToBlockchainId[PostsModelProvider.getEntityName()]
    );

    if (postIds.length === 0) {
      throw new Error(`There is no postIds in array. There are only such keys: ${Object.keys(entityNameToBlockchainId)}`);
    }

    for (const accountName in toProcess) {
      const current = toProcess[accountName];

      if (!postIds[accountName]) {
        console.warn(`There is no such post entity in Db ${accountName}, lets mark this as malformed`);
        toProcess[accountName].malformed = true;

        continue;
      }

      current.entity_id = postIds[accountName];
    }
  }

  /**
   *
   * @param {Object} toProcess
   * @param {Object} lastOfGivenDateData
   * @private
   */
  static _addRateDelta(toProcess, lastOfGivenDateData) {
    if (lastOfGivenDateData.length === 0) {
      throw new Error('lastOfGivenDateData is empty');
    }

    for (let i = 0; i < lastOfGivenDateData.length; i++) {
      const current = lastOfGivenDateData[i];

      const related = toProcess[current.entity_blockchain_id];

      if (!related) {
        console.warn(`There is no such ${current.entity_blockchain_id} in lastData. Lets think that rate is disappeared. Skipping...`);

        continue;
      }

      if (current.json_value.importance < 0) {
        throw new Error(`Importance value is negative for entity ${JSON.stringify(current)}`);
      }

      related.importance_delta = +related.last_rate - +current.json_value.importance.toFixed(10);
      related.importance_delta = +related.importance_delta.toFixed(10);
    }
  }

  static _printMemoryDiff(toLabel, fromLabel) {
    const memoryTo    = profilingInfo[toLabel];
    const memoryFrom  = profilingInfo[fromLabel];

    const res = {};
    for (const key in memoryTo) {
      res[key] = `${+memoryTo[key].replace(' MB', '') - +memoryFrom[key].replace(' MB', '')} MB`;
    }

    console.log(`${toLabel} minus ${fromLabel} is: ${JSON.stringify(res, null, 2)}`)
  }

  static _printMemoryUsage(label, toPrint = true) {
    const usedFormatted = {};

    const used = process.memoryUsage();
    for (let key in used) {
      usedFormatted[key] = `${Math.round(used[key] / 1024 / 1024 * 100) / 100} MB`;
    }

    profilingInfo[label] = usedFormatted;

    if (toPrint) {
      console.log(`${label}: ${JSON.stringify(usedFormatted, null, 2)}`);
    }
  }



}

module.exports = ImportanceEventService;