import { IModelDto } from '../../common/interfaces/common-model-interfaces';
import RepositoryHelper = require('../../common/repository/repository-helper');
import OffersModel = require('./offers-model');
import StreamsModel = require('./streams-model');
const { Model } = require('objection');

class ClicksModel extends Model implements IModelDto {
  readonly id!:             number;

  readonly offer_id!:       number;
  readonly stream_id!:      number;
  readonly user_unique_id!: number;
  readonly json_headers!:   unknown;
  readonly referer!:        string;

  readonly created_at!:   Date;

  readonly offer!:  OffersModel;
  readonly stream!: StreamsModel;
  readonly click!:  ClicksModel;

  public static getTableName(): string {
    return 'affiliates.clicks';
  }

  $afterGet() {
    RepositoryHelper.convertStringFieldsToNumbers(
      this,
      this.getNumericalFields(),
      this.getNumericalFields(),
    );
  }

  static get relationMappings() {
    const OffersModel = require('./offers-model');
    const StreamsModel = require('./streams-model');

    return {
      offer: {
        relation: Model.BelongsToOneRelation,
        modelClass: OffersModel,
        join: {
          from: `${this.getTableName()}.offer_id`,
          to: `${OffersModel.getTableName()}.id`,
        }
      },
      stream: {
        relation: Model.BelongsToOneRelation,
        modelClass: StreamsModel,
        join: {
          from: `${this.getTableName()}.stream_id`,
          to: `${StreamsModel.getTableName()}.id`,
        }
      },
    }
  }

  getNumericalFields(): string[] {
    return [
      'id',
      'offer_id',
      'stream_id',
    ];
  }
}

export = ClicksModel;
