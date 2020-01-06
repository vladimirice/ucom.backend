"use strict";
const PostsFieldsSet = require("../models/posts-fields-set");
const { EntityNames } = require('ucom.libs.common').Common.Dictionary;
const models = require('../../../models');
const ENTITY_NAME = EntityNames.POSTS;
const TABLE_NAME = 'posts';
const POST_STATS_TABLE_NAME = 'post_stats';
const POST_OFFER_TABLE_NAME = 'post_offer';
const POST_USERS_TEAM_TABLE_NAME = 'post_users_team';
const MEDIA_POST_BLOCKCHAIN_ID_PREFIX = 'pstms';
const POST_OFFER_BLOCKCHAIN_ID_PREFIX = 'pstos';
const DIRECT_POST_BLOCKCHAIN_ID_PREFIX = 'pstdr';
const REPOST_POST_BLOCKCHAIN_ID_PREFIX = 'pstrp';
class PostsModelProvider {
    /**
     *
     * @return {string}
     */
    static getMediaPostBlockchainIdPrefix() {
        return MEDIA_POST_BLOCKCHAIN_ID_PREFIX;
    }
    /**
     *
     * @return {string}
     */
    static getPostOfferBlockchainIdPrefix() {
        return POST_OFFER_BLOCKCHAIN_ID_PREFIX;
    }
    /**
     *
     * @return {string}
     */
    static getDirectPostBlockchainIdPrefix() {
        return DIRECT_POST_BLOCKCHAIN_ID_PREFIX;
    }
    /**
     * @deprecated
     * should be generated on the frontend using wallet library
     * @return {string}
     */
    static getRepostBlockchainIdPrefix() {
        return REPOST_POST_BLOCKCHAIN_ID_PREFIX;
    }
    /**
     *
     * @return {string}
     */
    static getEntityName() {
        return ENTITY_NAME;
    }
    static getCurrentParamsTableName() {
        return 'posts_current_params';
    }
    static getCurrentParamsForeignColumn() {
        return 'post_id';
    }
    /**
     *
     * @return {string}
     */
    static getBlockchainIdFieldName() {
        return 'blockchain_id';
    }
    /**
     *
     * @return {string}
     */
    static getModelName() {
        return TABLE_NAME;
    }
    /**
     *
     * @return {string}
     */
    static getTableName() {
        return TABLE_NAME;
    }
    /**
     *
     * @return {Object}
     */
    static getModel() {
        return models[TABLE_NAME];
    }
    /**
     *
     * @return {Object}
     */
    static getPostStatsModel() {
        return models[POST_STATS_TABLE_NAME];
    }
    /**
     *
     * @return {Object}
     */
    static getPostOfferModel() {
        return models[POST_OFFER_TABLE_NAME];
    }
    // noinspection JSUnusedGlobalSymbols
    /**
     *
     * @return {Object}
     */
    static getPostUsersTeamModel() {
        return models[POST_USERS_TEAM_TABLE_NAME];
    }
    /**
     *
     * @return {Object}
     */
    static getPostsStatsInclude() {
        return {
            attributes: ['comments_count'],
            model: this.getPostStatsModel(),
            as: POST_STATS_TABLE_NAME,
            required: false,
        };
    }
    static getPostsStatsTableName() {
        return POST_STATS_TABLE_NAME;
    }
    /**
     *
     * @return {Object[]}
     */
    // static getPostOfferInclude() {
    //   return [
    //     {
    //       model: this.getPostOfferModel()
    //     },
    //     {
    //       model: this.getPostUsersTeamModel(),
    //       as: POST_USERS_TEAM_TABLE_NAME,
    //       include: [
    //         {
    //           model: models.Users,
    //           attributes: models.Users.getFieldsForPreview(),
    //         }
    //       ]
    //     }
    //   ];
    // }
    static getPostsFieldsForPreview() {
        return this.getModel().getFieldsForPreview();
    }
    static getPostsFieldsForCard() {
        return this.getModel().getFieldsForCard();
    }
    static getPostOfferItselfInclude() {
        return {
            model: this.getPostOfferModel(),
        };
    }
    static getCurrentParamsSequelizeModel() {
        return models[this.getCurrentParamsTableName()];
    }
    static getCurrentParamsSequelizeInclude() {
        return {
            attributes: ['importance_delta'],
            model: this.getCurrentParamsSequelizeModel(),
            required: false,
            as: PostsModelProvider.getCurrentParamsTableName(),
        };
    }
    /**
     *
     * @return {Object}
     */
    static getParentPostInclude() {
        return {
            attributes: this.getPostsFieldsForPreview(),
            model: models.posts,
            as: 'post',
            required: false,
            include: [
                {
                    model: models.Users,
                    attributes: models.Users.getFieldsForPreview(),
                    include: [
                        {
                            model: models.uos_accounts_properties,
                            attributes: [
                                'staked_balance',
                                'validity',
                                'importance',
                                'scaled_importance',
                                'stake_rate',
                                'scaled_stake_rate',
                                'social_rate',
                                'scaled_social_rate',
                                'transfer_rate',
                                'scaled_transfer_rate',
                                'previous_cumulative_emission',
                                'current_emission',
                                'current_cumulative_emission',
                            ],
                            required: false,
                            as: 'uos_accounts_properties',
                        },
                        {
                            model: models.users_current_params,
                            attributes: [
                                'posts_total_amount_delta',
                                'scaled_importance_delta',
                                'scaled_social_rate_delta',
                            ],
                            required: false,
                            as: 'users_current_params',
                        },
                    ],
                },
                {
                    model: models.organizations,
                    attributes: models.organizations.getFieldsForPreview(),
                    required: false,
                },
                this.getPostsStatsInclude(),
            ],
        };
    }
    /**
     *
     * @return {string}
     */
    static getPostsSingularName() {
        return 'post';
    }
    /**
     *
     * @param {string} entityName
     * @return {boolean}
     */
    static isPost(entityName) {
        return entityName === this.getEntityName();
    }
    static getTextOnlyFields() {
        return this.getModel().getSimpleTextFields();
    }
    static getHtmlFields() {
        return this.getModel().getHtmlFields();
    }
    static getNumericalFields() {
        return [
            'post_type_id',
            'blockchain_id',
        ];
    }
    static getPostRelatedFieldsSet() {
        return PostsFieldsSet.getAllFieldsSet();
    }
}
module.exports = PostsModelProvider;
