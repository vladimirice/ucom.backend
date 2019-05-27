"use strict";
const { Model } = require('objection');
class TempModel extends Model {
    static get tableName() {
        return 'temp';
    }
}
module.exports = TempModel;
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
