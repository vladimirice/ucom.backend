import { Transaction } from 'knex';

const knex = require('../../../config/knex');

const TABLE_NAME = 'entity_tags';

class EntityTagsRepository {

  static async createNewEntityTags(toInsert: Object[], trx: Transaction) : Promise<any> {
    return knex(TABLE_NAME).transacting(trx).insert(toInsert);
  }

  static async findAllByEntity(entityId: number, entityName: string): Promise<Object> {
    const where = {
      entity_id: entityId,
      entity_name: entityName,
    };

    const unprocessed = await knex(TABLE_NAME).select(['id', 'tag_title'])
        .where(where)
    ;

    const res: Object = {};
    unprocessed.forEach((item) => {
      res[item.tag_title] = +item.id;
    });

    return res;
  }

  /**
   *
   * @param {number} entityId
   * @param {string} entityName
   */
  static async findAllWithAllFieldsByEntity(
    entityId: number,
    entityName: string,
  ): Promise<Object[]> {
    const where = {
      entity_id: entityId,
      entity_name: entityName,
    };

    return knex(TABLE_NAME)
        .where(where)
    ;
  }
}

export = EntityTagsRepository;
