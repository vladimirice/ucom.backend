import AffiliatesModelProvider = require('../service/affiliates-model-provider');
import RepositoryHelper = require('../../common/repository/repository-helper');
import { IModelDto } from '../../common/interfaces/common-model-interfaces';

const { Model } = require('objection');

class OffersModel extends Model implements IModelDto {
  readonly id!:               number;

  readonly title!:            string;
  readonly post_id!:          number;
  readonly status!:           number;
  readonly attribution_id!:   number;
  readonly event_id!:         number;
  readonly participation_id!: number;
  readonly url_template!:     number;

  readonly created_at!:       Date;
  readonly updated_at!:       Date;
  readonly started_at!:       Date;
  readonly finished_at!:      Date;

  $afterGet() {
    RepositoryHelper.convertStringFieldsToNumbers(
      this,
      this.getNumericalFields(),
      this.getNumericalFields(),
    );
  }

  public static getTableName(): string {
    return AffiliatesModelProvider.getOffersTableName();
  }

  public getNumericalFields(): string[] {
    return [
      'id',
      'post_id',
      'status',
      'attribution_id',
      'event_id',
      'participation_id',
    ];
  }
}

export = OffersModel;
