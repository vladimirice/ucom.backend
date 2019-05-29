"use strict";
const AffiliatesModelProvider = require("../service/affiliates-model-provider");
const RepositoryHelper = require("../../common/repository/repository-helper");
const { Model } = require('objection');
const offersTableName = AffiliatesModelProvider.getOffersTableName();
class ClicksModel extends Model {
    static getTableName() {
        return AffiliatesModelProvider.getStreamsTableName();
    }
    $afterGet() {
        RepositoryHelper.convertStringFieldsToNumbers(this, this.getNumericalFields(), this.getNumericalFields());
    }
    static get relationMappings() {
        const OffersModel = require('./offers-model.js');
        return {
            offer: {
                relation: Model.BelongsToOneRelation,
                modelClass: OffersModel,
                join: {
                    from: `${this.getTableName()}.offer_id`,
                    to: `${offersTableName}.id`,
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
module.exports = ClicksModel;
