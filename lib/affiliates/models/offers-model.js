"use strict";
const AffiliatesModelProvider = require("../service/affiliates-model-provider");
const RepositoryHelper = require("../../common/repository/repository-helper");
const { Model } = require('objection');
class OffersModel extends Model {
    $afterGet() {
        RepositoryHelper.convertStringFieldsToNumbers(this, this.getNumericalFields(), this.getNumericalFields());
    }
    static getTableName() {
        return AffiliatesModelProvider.getOffersTableName();
    }
    getNumericalFields() {
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
module.exports = OffersModel;
