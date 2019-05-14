import { IModelFieldsSet } from '../../common/interfaces/models-dto';

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

  public static getCurrentParamsForeignColumn(): string {
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
      as:    POST_STATS_TABLE_NAME,
      required: false, // #task
    };
  }

  public static getPostsStatsTableName(): string {
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

  public static getPostsFieldsForPreview(): string[] {
    return this.getModel().getFieldsForPreview();
  }

  public static getPostsFieldsForCard(): string[] {
    return this.getModel().getFieldsForCard();
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

  public static getTextOnlyFields(): string[] {
    return this.getModel().getSimpleTextFields();
  }

  public static getHtmlFields(): string[] {
    return this.getModel().getHtmlFields();
  }

  public static getNumericalFields(): string[] {
    return [
      'post_type_id',
      'blockchain_id',
    ];
  }

  public static getPostRelatedFieldsSet(): IModelFieldsSet {
    return {
      post_type_id: {
        type: 'number',
        request: {
          sanitizationType: 'number',
        },
      },
      title: {
        type: 'string',
        request: {
          sanitizationType: 'text',
        },
      },
      description: {
        type: 'string',
        request: {
          sanitizationType: 'html',
        },
      },
      main_image_filename: { // deprecated
        type: 'string',
      },
      current_vote: {
        type: 'number',
      },
      current_rate: {
        type: 'number',
      },
      created_at: {
        type: 'datetime',
      },
      updated_at: {
        type: 'datetime',
      },
      user_id: {
        type: 'number',
      },
      leading_text: {
        type: 'string',
        request: {
          sanitizationType: 'text',
        },
      },
      blockchain_id: {
        type: 'string',
        request: {
          sanitizationType: 'text',
        },
      },
      blockchain_status: { // @deprecated
        type: 'string',
      },
      organization_id: {
        type: 'number',
        request: {
          sanitizationType: 'number',
        },
      },
      entity_id_for: {
        type: 'number',
      },
      entity_name_for: {
        type: 'number',
      },
      parent_id: {
        type: 'number',
      },
      entity_images: {
        type: 'any',
        request: {
          sanitizationType: 'any',
        },
      },
      entity_tags: {
        type: 'any',
      },
    };
  }
}

export = PostsModelProvider;
