import AffiliatesModelProvider = require('../service/affiliates-model-provider');
import { IModelDto } from '../../common/interfaces/common-model-interfaces';
import RepositoryHelper = require('../../common/repository/repository-helper');
const { Model } = require('objection');

const offersTableName = AffiliatesModelProvider.getOffersTableName();
const streamsTableName = AffiliatesModelProvider.getStreamsTableName();
const clicksTableName = AffiliatesModelProvider.getClicksTableName();

class ConversionsModel extends Model implements IModelDto {
  readonly id!:                 number;

  readonly offer_id!:           number;
  readonly stream_id!:          number;
  readonly click_id!:           number;

  readonly users_activity_id!:  number;
  readonly user_id!:            number;
  readonly status!:             number;

  readonly json_headers!:       unknown;
  readonly referer!:            string;

  readonly created_at!:         Date;

  public static getTableName(): string {
    return AffiliatesModelProvider.getConversionsTableName();
  }

  $afterGet() {
    RepositoryHelper.convertStringFieldsToNumbers(
      this,
      this.getNumericalFields(),
      this.getNumericalFields(),
    );
  }

  static get relationMappings() {
    const OffersModel   = require('./offers-model');
    const StreamsModel  = require('./streams-model');
    const ClicksModel   = require('./clicks-model');

    return {
      offer: {
        relation: Model.BelongsToOneRelation,
        modelClass: OffersModel,
        join: {
          from: `${this.getTableName()}.offer_id`,
          to: `${offersTableName}.id`,
        }
      },
      stream: {
        relation: Model.BelongsToOneRelation,
        modelClass: StreamsModel,
        join: {
          from: `${this.getTableName()}.stream_id`,
          to: `${streamsTableName}.id`,
        }
      },
      click: {
        relation: Model.BelongsToOneRelation,
        modelClass: ClicksModel,
        join: {
          from: `${this.getTableName()}.click_id`,
          to: `${clicksTableName}.id`,
        }
      },
    }
  }

  getNumericalFields(): string[] {
    return [
      'id',
      'offer_id',
      'stream_id',
      'click_id',
      'users_activity_id',
      'user_id',
      'status',
    ];
  }
}

export = ConversionsModel;
