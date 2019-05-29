"use strict";
const AffiliatesModelProvider = require("../service/affiliates-model-provider");
const RepositoryHelper = require("../../common/repository/repository-helper");
const { Model } = require('objection');
const offersTableName = AffiliatesModelProvider.getOffersTableName();
const streamsTableName = AffiliatesModelProvider.getStreamsTableName();
const clicksTableName = AffiliatesModelProvider.getClicksTableName();
class ConversionsModel extends Model {
    static getTableName() {
        return AffiliatesModelProvider.getConversionsTableName();
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
                    to: `${offersTableName}.id`,
                }
            },
            stream: {
                relation: Model.BelongsToOneRelation,
                modelClass: StreamsModel,
                join: {
                    from: `${this.getTableName()}.stream_id`,
                    to: `${streamsTableName}.id`,
                }
            },
            click: {
                relation: Model.BelongsToOneRelation,
                modelClass: ClicksModel,
                join: {
                    from: `${this.getTableName()}.click_id`,
                    to: `${clicksTableName}.id`,
                }
            },
        };
    }
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
