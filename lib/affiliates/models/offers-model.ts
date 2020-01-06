import { IModelDto } from '../../common/interfaces/common-model-interfaces';

import RepositoryHelper = require('../../common/repository/repository-helper');

const { Model } = require('objection');

import Hashids = require('hashids');

class OffersModel extends Model implements IModelDto {
  readonly id!:                     number;

  readonly title!:                  string;

  readonly post_id!:                number;

  readonly status!:                 number;

  readonly attribution_id!:         number;

  readonly event_id!:               number;

  readonly participation_id!:       number;

  readonly redirect_url_template!:  string;

  readonly hash!:                   string;

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

  async $afterInsert() {
    RepositoryHelper.convertStringFieldsToNumbers(
      this,
      this.getNumericalFields(),
      this.getNumericalFields(),
    );

    await this.generateHash();
  }

  async $beforeInsert() {
    // @ts-ignore
    this.hash = 'hash';
  }

  public static getTableName(): string {
    return 'affiliates.offers';
  }

  // eslint-disable-next-line class-methods-use-this
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

  private async generateHash(): Promise<void> {
    const hashids = new Hashids();

    const hash = hashids.encode(+this.id);

    await this
      .$query()
      .patch({ hash });
  }
}

export = OffersModel;
