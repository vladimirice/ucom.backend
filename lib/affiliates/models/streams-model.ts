import { IModelDto } from '../../common/interfaces/common-model-interfaces';
import RepositoryHelper = require('../../common/repository/repository-helper');
import OffersModel = require('./offers-model');
const { Model } = require('objection');

class StreamsModel extends Model implements IModelDto {
  readonly id!:           number;

  readonly user_id!:      number;
  readonly account_name!: string;
  readonly offer_id!:     number;
  readonly landing_url!:  string;
  readonly redirect_url!: string;

  readonly created_at!:   Date;
  readonly updated_at!:   Date;

  readonly offer!: OffersModel;

  public static getTableName(): string {
    return 'affiliates.streams';
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

    return {
      offer: {
        relation: Model.BelongsToOneRelation,
        modelClass: OffersModel,
        join: {
          from: `${this.getTableName()}.offer_id`,
          to: `${OffersModel.getTableName()}.id`,
        }
      }
    }
  }

  getNumericalFields(): string[] {
    return [
      'id',
      'user_id',
      'offer_id',
    ];
  }
}

export = StreamsModel;
