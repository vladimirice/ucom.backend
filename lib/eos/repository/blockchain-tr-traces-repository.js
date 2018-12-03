const knex = require('../../../config/knex');
const UsersModelProvider = require('../../users/users-model-provider');

const TABLE_NAME = 'blockchain_tr_traces';

class BlockchainTrTracesRepository {
  /**
   *
   * @param {Object} models
   * @returns {Promise<*>}
   */
  static async insertManyTrTraces(models) {
    await knex(TABLE_NAME).insert(models);
  }

  /**
   *
   * @param {string} accountName
   * @returns {Promise<Object[]>}
   */
  static async findAllByAccountNameFrom(accountName) {
    const relUserAlias  = 'rel_user';
    const delimiter = '__';

    const toSelect = [];
    const usersPreviewFields = UsersModelProvider.getUserFieldsForPreview();

    usersPreviewFields.forEach(field => {
      toSelect.push(`${relUserAlias}.${field} AS ${relUserAlias}${delimiter}${field}`);
    });

    const mainTableFields = [
      'tr_executed_at',
      'tr_type',
      'tr_processed_data',
      'memo',
      'account_name_from',
      'account_name_to'
    ];

    mainTableFields.forEach(field => {
      toSelect.push(`${TABLE_NAME}.${field} AS ${field}`);
    });

    const dbData = await knex.select(toSelect)
      .from(TABLE_NAME)
      .where('tr_executed_at', '>=', '2018-11-29 00:00:00') // Because executed_at is equal to mongodb created at and created at = first sync
      .andWhere(function () {
        this.where('account_name_from', accountName);
        this.orWhere('account_name_to', accountName)
      })
      .leftJoin(`Users AS ${relUserAlias}`, function() {
        this.on(function() {
          this.on(function() {
            this.on(`${TABLE_NAME}.account_name_from`, '=', `${relUserAlias}.account_name`);
            this.andOn(`${TABLE_NAME}.account_name_from`, '!=', knex.raw('?', accountName))
          });
          this.orOn(function() {
            this.on(`${TABLE_NAME}.account_name_to`, '=', `${relUserAlias}.account_name`);
            this.andOn(`${TABLE_NAME}.account_name_to`, '!=', knex.raw('?', accountName))
          })
        })
      })
      .orderBy('tr_executed_at', 'DESC')
      .limit(100) // TODO - provode pagination
    ;

    // Hydration
    for (let i = 0; i < dbData.length; i++) {
      const current = dbData[i];

      const User = {};
      current.User = null;
      for (const field in current) {
        if (field.startsWith(relUserAlias)) {
          const processedField = field.replace(relUserAlias + delimiter, '');

          if (User[processedField]) {
            throw new Error(`User already has field ${processedField}. Probably SQL join is not correct.`);
          }

          User[processedField] = current[field];
        }
      }

      if (User.id !== null) {
        current.User = User;
      }

      usersPreviewFields.forEach(field => {
        delete current[relUserAlias + delimiter + field];
      });
    }

    return dbData;
  }

  static async setSeqCurrentValByMaxNum() {
    await knex.raw(`SELECT setval('${TABLE_NAME}_id_seq', (SELECT MAX(id) from "${TABLE_NAME}"));`);
  }

  /**
   * @param {number} trType
   * @returns {Promise<string|null>}
   */
  static async findLastExternalIdByTrType(trType) {
    const res = await knex.select('external_id')
      .from(TABLE_NAME)
      .where({tr_type: trType})
      .orderBy('id', 'DESC')
      .limit(1)
      .first()
    ;

    return res ? res.external_id : null;
  }
}

module.exports = BlockchainTrTracesRepository;