import { UserExternalModel } from '../interfaces/model-interfaces';
import { StringToAnyCollection } from '../../common/interfaces/common-types';

import knex = require('../../../config/knex');
import UsersExternalModelProvider = require('../service/users-external-model-provider');
import RepositoryHelper = require('../../common/repository/repository-helper');
import ExternalTypeIdDictionary = require('../dictionary/external-type-id-dictionary');
import AirdropsModelProvider = require('../../airdrops/service/airdrops-model-provider');

const TABLE_NAME = UsersExternalModelProvider.usersExternalTableName();
const airdropsUsersExternalData = AirdropsModelProvider.airdropsUsersExternalDataTableName();

class UsersExternalRepository {
  public static async getUserExternalWithExternalAirdropData(
    userId: number,
    airdropId: number,
  ): Promise<StringToAnyCollection> {
    return knex(TABLE_NAME)
      .select([
        `${TABLE_NAME}.id AS primary_key`,
        `${TABLE_NAME}.external_id AS external_id`,
        `${airdropsUsersExternalData}.status AS status`,
        `${airdropsUsersExternalData}.json_data AS json_data`,
      ])
      .leftJoin(airdropsUsersExternalData, function () {
        // @ts-ignore
        this.on(`${TABLE_NAME}.id`, '=', `${airdropsUsersExternalData}.users_external_id`)
          .andOn(`${airdropsUsersExternalData}.airdrop_id`, '=', airdropId);
      })
      .where(`${TABLE_NAME}.user_id`, userId)
      .first();
  }

  public static async setUserId(id: number, userId: number): Promise<void> {
    await knex(TABLE_NAME)
      .where('id', '=', id)
      .update({ user_id: userId })
    ;
  }

  public static async upsertExternalUser(
    externalTypeId: number,
    externalId: number,
    externalLogin: string,
    jsonValue: any,
    user_id: number | null,
  ): Promise<number> {
    const sql = `
      INSERT INTO ${TABLE_NAME} (external_type_id, external_id, external_login, json_value, user_id) VALUES
      (${+externalTypeId}, ${+externalId}, '${externalLogin}', $$${JSON.stringify(jsonValue)}$$, ${user_id})
      ON CONFLICT (external_type_id, external_id) DO
      UPDATE
          SET json_value        = EXCLUDED.json_value,
              updated_at        = EXCLUDED.updated_at,
              external_login    = EXCLUDED.external_login
              
      RETURNING id;
    ;
    `;

    const res = await knex.raw(sql);

    return +res.rows[0].id;
  }

  public static async findGithubUserExternalExternalId(
    id: number,
  ): Promise<UserExternalModel | null> {
    const where = {
      external_id: id,
      external_type_id: ExternalTypeIdDictionary.github(),
    };

    const res = await  knex(TABLE_NAME)
      .where(where)
      .first()
    ;

    if (!res) {
      return null;
    }

    RepositoryHelper.convertStringFieldsToNumbers(res, this.getNumericalFields());

    return res;
  }

  public static async findGithubUserExternalByPkId(
    id: number,
  ): Promise<UserExternalModel | null> {
    const where = {
      id,
      external_type_id: ExternalTypeIdDictionary.github(),
    };

    const res = await knex(TABLE_NAME)
      .where(where)
      .first()
    ;

    if (!res) {
      return null;
    }

    RepositoryHelper.convertStringFieldsToNumbers(res, this.getNumericalFields());

    return res;
  }

  public static async findGithubUserExternalByUserId(
    userId: number,
  ): Promise<UserExternalModel | null> {
    const where = {
      user_id: userId,
      external_type_id: ExternalTypeIdDictionary.github(),
    };

    const res = await knex(TABLE_NAME)
      .where(where)
      .first()
    ;

    if (!res) {
      return null;
    }

    RepositoryHelper.convertStringFieldsToNumbers(res, this.getNumericalFields(), this.getNumericalFields());

    return res;
  }

  private static getNumericalFields(): string[] {
    return [
      'id',
      'external_id',
    ];
  }
}

export = UsersExternalRepository;
