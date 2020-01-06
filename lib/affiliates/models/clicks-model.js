"use strict";
const RepositoryHelper = require("../../common/repository/repository-helper");
const { Model } = require('objection');
class ClicksModel extends Model {
    static getTableName() {
        return 'affiliates.clicks';
    }
    $afterGet() {
        RepositoryHelper.convertStringFieldsToNumbers(this, this.getNumericalFields(), this.getNumericalFields());
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
                },
            },
            stream: {
                relation: Model.BelongsToOneRelation,
                modelClass: StreamsModel,
                join: {
                    from: `${this.getTableName()}.stream_id`,
                    to: `${StreamsModel.getTableName()}.id`,
                },
            },
        };
    }
    // eslint-disable-next-line class-methods-use-this
    getNumericalFields() {
        return [
            'id',
            'offer_id',
            'stream_id',
        ];
    }
}
module.exports = ClicksModel;
