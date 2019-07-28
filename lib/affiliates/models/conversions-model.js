"use strict";
const RepositoryHelper = require("../../common/repository/repository-helper");
const { Model } = require('objection');
class ConversionsModel extends Model {
    static getTableName() {
        return 'affiliates.conversions';
    }
    $afterGet() {
        RepositoryHelper.convertStringFieldsToNumbers(this, this.getNumericalFields(), this.getNumericalFields());
    }
    static get relationMappings() {
        const OffersModel = require('./offers-model');
        const StreamsModel = require('./streams-model');
        const ClicksModel = require('./clicks-model');
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
            click: {
                relation: Model.BelongsToOneRelation,
                modelClass: ClicksModel,
                join: {
                    from: `${this.getTableName()}.click_id`,
                    to: `${ClicksModel.getTableName()}.id`,
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
            'click_id',
            'users_activity_id',
            'user_id',
            'status',
        ];
    }
}
module.exports = ConversionsModel;
