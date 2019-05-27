import AffiliatesModelProvider = require('../service/affiliates-model-provider');

const { Model } = require('objection');

class OffersModel extends Model {
  readonly title!: string;

  public static getTableName() {
    return AffiliatesModelProvider.getOffersTableName();
  }

  public getSmile() {
    return this.title + ':)';
  }
}

export = OffersModel;


/*
  readonly id: number;

  readonly created_at: any;
  readonly updated_at: any;
  readonly started_at: any;
  readonly finished_at: any;

  readonly post_id: number;
  readonly status: number;
  readonly title: string;
  readonly attribution_model_id: number;
  readonly event_id: number;
  readonly participation_id: number;
  readonly url_template: number;
*/
