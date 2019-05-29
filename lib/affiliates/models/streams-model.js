"use strict";
const RepositoryHelper = require("../../common/repository/repository-helper");
const { Model } = require('objection');
class StreamsModel extends Model {
    static getTableName() {
        return 'affiliates.streams';
    }
    $afterGet() {
        RepositoryHelper.convertStringFieldsToNumbers(this, this.getNumericalFields(), this.getNumericalFields());
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
        };
    }
    getNumericalFields() {
        return [
            'id',
            'user_id',
            'offer_id',
        ];
    }
}
module.exports = StreamsModel;
