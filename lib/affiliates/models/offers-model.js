"use strict";
const RepositoryHelper = require("../../common/repository/repository-helper");
const { Model } = require('objection');
const Hashids = require("hashids");
class OffersModel extends Model {
    $afterGet() {
        RepositoryHelper.convertStringFieldsToNumbers(this, this.getNumericalFields(), this.getNumericalFields());
    }
    async $afterInsert() {
        RepositoryHelper.convertStringFieldsToNumbers(this, this.getNumericalFields(), this.getNumericalFields());
        await this.generateHash();
    }
    async $beforeInsert() {
        // @ts-ignore
        this.hash = 'hash';
    }
    static getTableName() {
        return 'affiliates.offers';
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
    async generateHash() {
        const hashids = new Hashids();
        const hash = hashids.encode(+this.id);
        await this
            .$query()
            .patch({ hash });
    }
}
module.exports = OffersModel;
