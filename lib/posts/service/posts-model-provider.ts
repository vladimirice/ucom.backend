const models = require('../../../models');

const ENTITY_NAME = 'posts     ';
const TABLE_NAME = 'posts';

const POST_STATS_TABLE_NAME       = 'post_stats';
const POST_OFFER_TABLE_NAME       = 'post_offer';
const POST_USERS_TEAM_TABLE_NAME  = 'post_users_team';

const MEDIA_POST_BLOCKCHAIN_ID_PREFIX   = 'pstms';
const POST_OFFER_BLOCKCHAIN_ID_PREFIX   = 'pstos';
const DIRECT_POST_BLOCKCHAIN_ID_PREFIX  = 'pstdr';
const REPOST_POST_BLOCKCHAIN_ID_PREFIX  = 'pstrp';


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
   *
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

  public static getCurrentParamsTableName(): string {
    return 'posts_current_params';
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
      as:    POST_STATS_TABLE_NAME,
      required: false, // #task
    };
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

  /**
   *
   * @return {string[]}
   */
  static getPostsFieldsForPreview() {
    return this.getModel().getFieldsForPreview();
  }

  static getPostOfferItselfInclude() {
    return {
      model: this.getPostOfferModel(),
    };
  }

  public static getCurrentParamsSequelizeModel() {
    return models[this.getCurrentParamsTableName()];
  }

  public static getCurrentParamsSequelizeInclude() {
    return {
      attributes: ['importance_delta'],
      model:      this.getCurrentParamsSequelizeModel(),
      required:   false, // #task - should be always required
      as:         PostsModelProvider.getCurrentParamsTableName(),
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
          model:      models.Users,
          attributes: models.Users.getFieldsForPreview(),
          required:   true,
        },
        {
          model:      models.organizations,
          attributes: models.organizations.getFieldsForPreview(),
          required:   false,
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
}

export = PostsModelProvider;
