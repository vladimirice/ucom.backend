/* tslint:disable:max-line-length */
const db = require('../../../models').sequelize;

const moment = require('moment');

const postsModelProvider            = require('../../../lib/posts/service/posts-model-provider');

/**
 * @deprecated - related to stats-calculator-prototype
 */
class EntityEventParamGenerator {
  /**
   *
   * @return {*[]}
   */
  static getSampleDataSet() {
    const createdAtSet = {
      before: '2018-11-21 00:00:00.999275',
      after: moment().utc().format('YYYY-MM-DD HH:mm:ss'),
    };

    const dataSet = [
      {
        blockchain_id: 'sample_user_himself_new_post_blockchain_id_1', // this structure is generated inside mock function
        entity_name: postsModelProvider.getEntityName(),
        event_type: 1,
        importance: {
          before: 7.721208926,
          after: 10.211208926,
        },
        created_at: createdAtSet,
      },
      {
        blockchain_id: 'sample_user_himself_new_post_blockchain_id_2', // this structure is generated inside mock function
        entity_name: postsModelProvider.getEntityName(),
        event_type: 1,
        importance: {
          before: 4.721208926,
          after: 2.211208926,
        },
        created_at: createdAtSet,
      },
      // disturbance
      {
        blockchain_id: 'sample_anything', // this structure is generated inside mock function
        entity_name: 'org       ',
        event_type: 1,
        importance: {
          before: 4.721208926,
          after: 2.211208926,
        },
        created_at: createdAtSet,
      },

      // disturbance
      {
        blockchain_id: 'other_sample_anything', // this structure is generated inside mock function
        entity_name: 'users     ',
        event_type: 10,
        importance: {
          before: 4.721208926,
          after: 2.211208926,
        },
        created_at: createdAtSet,
      },
    ];

    return dataSet;
  }

  /**
   *
   * @param {Object[]} dataSet
   * @param {number[]} skipCreateBeforeFor
   * @param {number[]} skipCreateAfterFor
   * @return {Promise<void>}
   */
  static async createBasicSample(dataSet = [], skipCreateBeforeFor = [], skipCreateAfterFor = []) {
    if (dataSet.length === 0) {
      // @ts-ignore
      // tslint:disable-next-line
      dataSet = this.getSampleDataSet();
    }

    const toInsert: any = [];

    for (let i = 0; i < dataSet.length; i += 1) {
      const data: any = dataSet[i];

      let before  = `('${data.blockchain_id}'`;
      const importanceBefore = { importance: data.importance.before };

      let after   = `('${data.blockchain_id}'`;
      const importanceAfter = { importance: data.importance.after };

      before += `, '${data.entity_name}'`;
      before += `, '${JSON.stringify(importanceBefore)}'`;
      before += `, ${data.event_type}`;
      before += `, '${data.created_at.before}')`;

      after += `, '${data.entity_name}'`;
      after += `, '${JSON.stringify(importanceAfter)}'`;
      after += `, ${data.event_type}`;
      after += `, '${data.created_at.after}')`;

      // @ts-ignore
      if (!(~skipCreateBeforeFor.indexOf(i))) {
        toInsert.push(before);
      }

      // @ts-ignore
      if (!(~skipCreateAfterFor.indexOf(i))) {
        toInsert.push(after);
      }
    }

    const sql = `
      INSERT INTO entity_event_param (entity_blockchain_id, entity_name, json_value, event_type, created_at)
      VALUES ${toInsert.join(', ')}
    `;

    return db.query(sql);
  }
}

export = EntityEventParamGenerator;
