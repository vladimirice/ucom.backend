import AffiliatesModelProvider = require('../service/affiliates-model-provider');
import { IModelDto } from '../../common/interfaces/common-model-interfaces';
import RepositoryHelper = require('../../common/repository/repository-helper');

const { Model } = require('objection');

class StreamsModel extends Model implements IModelDto {
  readonly id!:           number;

  readonly user_id!:      number;
  readonly account_name!: string;
  readonly offer_id!:     number;

  readonly created_at!:   Date;
  readonly updated_at!:   Date;

  public static getTableName(): string {
    return AffiliatesModelProvider.getStreamsTableName();
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
      offers: {
        relation: Model.BelongsToOneRelation,
        modelClass: OffersModel,
        join: {
          from: 'streams.offer_id',
          to: 'offers.id',
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
