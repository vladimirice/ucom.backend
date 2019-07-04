/* eslint-disable import/no-dynamic-require */
/* tslint:disable:max-line-length */

import { GraphqlRequestHelper } from '../../helpers/common/graphql-request-helper';

import MockHelper = require('./mock-helper');
import UsersModelProvider = require('../../../lib/users/users-model-provider');
import UsersHelper = require('./users-helper');
import knexEvents = require('../../../config/knex-events');
import RabbitMqService = require('../../../lib/jobs/rabbitmq-service');
import UsersExternalModelProvider = require('../../../lib/users-external/service/users-external-model-provider');
import BlockchainModelProvider = require('../../../lib/eos/service/blockchain-model-provider');
import AccountsModelProvider = require('../../../lib/accounts/service/accounts-model-provider');
import CloseHandlersHelper = require('../../../lib/common/helper/close-handlers-helper');
import UosAccountsModelProvider = require('../../../lib/uos-accounts-properties/service/uos-accounts-model-provider');
import AirdropsModelProvider = require('../../../lib/airdrops/service/airdrops-model-provider');
import UsersTeamRepository = require('../../../lib/users/repository/users-team-repository');
import EntityModelProvider = require('../../../lib/entities/service/entity-model-provider');
import StreamsModel = require('../../../lib/affiliates/models/streams-model');
import OffersModel = require('../../../lib/affiliates/models/offers-model');
import ClicksModel = require('../../../lib/affiliates/models/clicks-model');
import ConversionsModel = require('../../../lib/affiliates/models/conversions-model');
import UsersCurrentParamsRepository = require('../../../lib/users/repository/users-current-params-repository');
import PostsModelProvider = require('../../../lib/posts/service/posts-model-provider');
import OrganizationsModelProvider = require('../../../lib/organizations/service/organizations-model-provider');
import TagsModelProvider = require('../../../lib/tags/service/tags-model-provider');
import knex = require('../../../config/knex');
import IrreversibleTracesClient = require('../../../lib/blockchain-traces/client/irreversible-traces-client');
import MongoExternalModelProvider = require('../../../lib/eos/service/mongo-external-model-provider');
import UosAccountsPropertiesUpdateService = require('../../../lib/uos-accounts-properties/service/uos-accounts-properties-update-service');

const models = require('../../../models');
const usersSeeds = require('../../../seeders/users/users');
const usersJobsSeeds = require('../../../seeders/users/users_jobs');
const usersEducationSeeds = require('../../../seeders/users/users_education');
const sourcesSeeds = require('../../../seeders/users/users_sources');
const postsSeeds = require('../../../seeders/posts/posts');
const postsOffersSeeds = require('../../../seeders/posts/posts-offers');
const postStatsSeeds = require('../../../seeders/posts/post-stats-seeds');
const postUsersTeamSeeds = require('../../../seeders/posts/posts-users-team');
const commentsSeeds = require('../../../seeders/comments/comments-seeds');
const organizationsSeeds = require('../../../seeders/organizations/organizations-seeds');

const organizationsRepositories = require('../../../lib/organizations/repository');
const usersRepositories = require('../../../lib/users/repository');
const postRepositories = require('../../../lib/posts/repository');
const usersModelProvider =  require('../../../lib/users/service').ModelProvider;

const rabbitMqService     = require('../../../lib/jobs/rabbitmq-service.js');

const orgSeeds = require('../../../seeders/organizations/organizations-seeds');
const usersTeamSeeds = require('../../../seeders/users/users-team-seeds');

const tableToSeeds = {
  [organizationsRepositories.Main.getOrganizationsModelName()]: orgSeeds,
  [usersRepositories.Main.getUsersModelName()]:                 usersSeeds,
  [usersModelProvider.getUsersTeamTableName()]:                 usersTeamSeeds,
  [postRepositories.MediaPosts.getModelName()]:                 postsSeeds,
};


const minorTablesToSkipSequences = [
  PostsModelProvider.getCurrentParamsTableName(),
  UsersModelProvider.getCurrentParamsTableName(),
  OrganizationsModelProvider.getCurrentParamsTableName(),
  TagsModelProvider.getCurrentParamsTableName(),

  'irreversible_traces',
  'outgoing_transactions_log',
  'uos_accounts_properties',
  UsersExternalModelProvider.usersExternalTableName(),
  UsersExternalModelProvider.usersExternalAuthLogTableName(),
  UsersModelProvider.getUsersActivityTrustTableName(),
  UsersModelProvider.getUsersActivityFollowTableName(),
  AirdropsModelProvider.airdropsTableName(),

  'offers',
  'streams',
  'clicks',
  'conversions',
  'users_activity_referral',
];

// Truncated async
const minorTables = [
  BlockchainModelProvider.irreversibleTracesTableName(),

  EntityModelProvider.getNotificationsTableName(),
  UsersTeamRepository.getModelName(),

  UsersModelProvider.getUsersActivityTrustTableName(),
  UsersModelProvider.getUsersActivityFollowTableName(),
  UsersModelProvider.getUsersActivityReferralTableName(),

  UosAccountsModelProvider.uosAccountsPropertiesTableName(),

  AirdropsModelProvider.airdropsUsersGithubRawTableName(),
  AirdropsModelProvider.airdropsUsersGithubRawRoundTwoTableName(),
  AirdropsModelProvider.airdropsUsersExternalDataTableName(),
  AirdropsModelProvider.airdropsTokensTableName(),
  AirdropsModelProvider.airdropsUsersTableName(),

  'entity_tags',
  'entity_state_log',

  'users_external_auth_log',

  'accounts_transactions_parts',

  UsersModelProvider.getCurrentParamsTableName(),

  'posts_current_params',
  'organizations_current_params',
  'organizations_to_entities',
  'tags_current_params',

  'total_current_params',

  'tags',
  'entity_stats_current',

  'blockchain_nodes',

  'post_ipfs_meta',

  'users_education',
  'users_jobs',
  'users_sources',

  'post_offer',
  'post_users_team',

  'entity_sources',

  'post_stats',

  // 'activity_user_user',
  'activity_user_post',
  'activity_user_comment',
];

// Truncated in order
const majorTables = [
  ConversionsModel.getTableName(),
  ClicksModel.getTableName(),
  StreamsModel.getTableName(),
  OffersModel.getTableName(),

  usersRepositories.Activity.getModelName(),

  AirdropsModelProvider.airdropsTableName(),

  AccountsModelProvider.accountsTableName(),
  AccountsModelProvider.accountsTransactionsTableName(),
  BlockchainModelProvider.outgoingTransactionsLogTableName(),

  'users_external',
  'comments',
  'posts',
  'organizations',
  'Users',

  'tags',
];

class SeedsHelper {
  /**
   * @deprecated
   */
  static async bulkCreateComments() {
    await this.bulkCreate('comments', commentsSeeds);
  }

  /**
   * @deprecated
   * @param {Object} user
   * @return {Promise<Object>}
   */
  static async createMediaPostWithoutOrg(user) {
    const data = {
      post_type_id: 1,
      title: 'EOS core library update',
      description: 'We are happy to announce a new major version of our EOS core library. A several cool features are successfully implemented',
      user_id: user.id,
      leading_text: 'Special update for our EOS people',
      created_at: new Date(),
      updated_at: new Date(),
      blockchain_id: 'sample_post_blockchain_id',
      entity_id_for: user.id,
      entity_name_for: UsersModelProvider.getEntityName(),
      entity_images: {},
    };

    const model = await models.posts.create(data);

    return model.toJSON();
  }

  /**
   * @deprecated
   * @see generators
   * @param {Object} user
   * @param {number} postId
   * @return {Promise<Object>}
   */
  static async createCommentOnPostWithoutOrg(user, postId) {
    const data = {
      description:    'sample post without org description',
      commentable_id: postId,
      blockchain_id:  'sample_comment_on_post_blockchain_id',
      parent_id:      null,
      user_id:        user.id,
      path:           [1], // Will be malformed if you create several comments
      depth: 0,
      entity_images: {},
    };

    const model = await models.comments.create(data);

    return model.toJSON();
  }

  /**
   *
   * @returns {Promise<void>}
   */
  static async purgeAllQueues() {
    await rabbitMqService.purgeAllQueues();
  }

  public static async noGraphQlNoMocking() {
    const beforeAfterOptions = {
      isGraphQl: false,
      workersMocking: 'none',
    };

    return this.beforeAllSetting(beforeAfterOptions);
  }

  public static async noGraphQlMockBlockchainOnly() {
    const beforeAfterOptions = {
      isGraphQl: false,
      workersMocking: 'blockchainOnly',
    };

    return this.beforeAllSetting(beforeAfterOptions);
  }

  public static async noGraphQlMockAllWorkers() {
    const beforeAfterOptions = {
      isGraphQl: false,
      workersMocking: 'all',
    };

    return this.beforeAllSetting(beforeAfterOptions);
  }

  public static async withGraphQlMockAllWorkers() {
    const beforeAfterOptions = {
      isGraphQl: true,
      workersMocking: 'all',
    };

    return this.beforeAllSetting(beforeAfterOptions);
  }

  public static async beforeAllSetting(options) {
    if (options.isGraphQl) {
      await GraphqlRequestHelper.beforeAll();
    }

    switch (options.workersMocking) {
      case 'blockchainOnly':
        MockHelper.mockAllTransactionSigning();
        MockHelper.mockAllBlockchainJobProducers();
        break;
      case 'allButSendingToQueue':
        MockHelper.mockAllBlockchainPart(false);
        break;
      case 'all':
        MockHelper.mockAllBlockchainPart(true);
        break;
      case 'none':
      case 'nothing':
        // do nothing
        break;
      default:
        throw new TypeError(`Unsupported workerMocking ${options.workersMocking}`);
    }
  }


  public static async beforeAllRoutineMockAccountsProperties() {
    const options = {
      mock: {
        uosAccountsProperties: true,
      },
    };

    return this.beforeAllRoutine(false, options);
  }

  /**
   *
   * @returns {Promise<*>}
   */
  static async beforeAllRoutine(
    mockAllBlockchain: boolean = false, // deprecated
    options: any = null,
  ) {
    if (mockAllBlockchain) {
      MockHelper.mockAllBlockchainPart();
    }

    await Promise.all([
      this.destroyTables(),
      // this.purgeAllQueues(),
      this.truncateEventsDb(),
    ]);

    const mongoDbConnection =
      await IrreversibleTracesClient.useCollection(MongoExternalModelProvider.actionTracesCollection());

    await mongoDbConnection.deleteMany({});

    const usersModel = usersRepositories.Main.getUsersModelName();

    // init users
    const usersSequence = this.getSequenceNameByModelName(usersModel);

    await this.resetSequence(usersSequence);
    await knex(UsersModelProvider.getTableName()).insert(usersSeeds);

    await Promise.all([
      knex('users_education').insert(usersEducationSeeds),
      knex('users_jobs').insert(usersJobsSeeds),
      knex('users_sources').insert(sourcesSeeds),
    ]);

    const [userVlad, userJane, userPetr, userRokky] =
      await Promise.all([
        UsersHelper.getUserVlad(),
        UsersHelper.getUserJane(),
        UsersHelper.getUserPetr(),
        UsersHelper.getUserRokky(),
      ]);

    await Promise.all([
      UsersCurrentParamsRepository.insertRowForNewEntity(userVlad.id),
      UsersCurrentParamsRepository.insertRowForNewEntity(userJane.id),
      UsersCurrentParamsRepository.insertRowForNewEntity(userPetr.id),
      UsersCurrentParamsRepository.insertRowForNewEntity(userRokky.id),
    ]);

    if (options && options.mock.uosAccountsProperties) {
      await MockHelper.mockUosAccountsPropertiesFetchService(userVlad, userJane, userPetr, userRokky);
      await UosAccountsPropertiesUpdateService.updateAll();
    }

    return [
      userVlad,
      userJane,
      userPetr,
      userRokky,
    ];
  }

  /**
   *
   * @param {string} name
   * @return {string}
   */
  static getSequenceNameByModelName(name) {
    if (name === usersRepositories.Main.getUsersModelName()) {
      return '"Users_id_seq"';
    }

    return `${name}_id_seq`;
  }

  // @deprecated. It is required because of deprecated seeding without generators
  static async resetSequence(name) {
    return knex.raw(`ALTER SEQUENCE ${name} RESTART;`);
  }

  static async bulkCreate(name, seeds) {
    return models[name].bulkCreate(seeds);
  }

  static async destroyTables() {
    const skipSequencesNames: string[] = [];

    for (const table of minorTablesToSkipSequences) {
      skipSequencesNames.push(`${table}_id_seq`);
    }

    // noinspection SqlResolve
    const allSequences = await models.sequelize.query('SELECT sequence_name FROM information_schema.sequences;');

    const resetSequencePromises: any = [];

    allSequences[0].forEach((data) => {
      const name = data.sequence_name;

      if (!skipSequencesNames.includes(name)) {
        // @deprecated - sequence reset was required for seeds, not for generators
        resetSequencePromises.push(models.sequelize.query(`ALTER SEQUENCE "${name}" RESTART;`));
      }
    });

    await Promise.all(resetSequencePromises);

    const minorTablesPromises: any = [];

    minorTables.forEach((table) => {
      minorTablesPromises.push(models.sequelize.query(`DELETE FROM ${table} WHERE 1=1`));
    });

    await Promise.all(minorTablesPromises);

    // eslint-disable-next-line unicorn/no-for-loop
    for (let i = 0; i < majorTables.length; i += 1) {
      if (majorTables[i] === 'Users') {
        await models.sequelize.query('DELETE FROM "Users" WHERE 1=1');
      } else {
        await models.sequelize.query(`DELETE FROM ${majorTables[i]} WHERE 1=1`);
      }
    }
  }

  // noinspection JSUnusedGlobalSymbols
  /**
   *
   * @param {string} tableName
   * @returns {Promise<void>}
   */
  static async truncateTable(tableName) {
    await models.sequelize.query(`TRUNCATE TABLE ${tableName};`);
  }

  static async initSeedsForUsers() {
    await this.destroyTables();

    await models.Users.bulkCreate(usersSeeds);
    await models.organizations.bulkCreate(organizationsSeeds);
    await models.posts.bulkCreate(postsSeeds);
  }

  /**
   * @use generators
   * @return {Promise<void>}
   */
  static async seedOrganizations() {
    await models.organizations.bulkCreate(organizationsSeeds);
  }

  static async seedPosts() {
    await models.posts.bulkCreate(postsSeeds);
  }

  static async initUsersOnly() {
    await this.destroyTables();

    await models.Users.bulkCreate(usersSeeds);
  }

  static async seedMainTables() {
    await models.Users.bulkCreate(usersSeeds);
    await models.organizations.bulkCreate(organizationsSeeds);
    await models.posts.bulkCreate(postsSeeds);
    await models.comments.bulkCreate(commentsSeeds);
  }

  static async seedDb() {
    await this.seedMainTables();

    await Promise.all([
      models.users_education.bulkCreate(usersEducationSeeds),
      models.users_jobs.bulkCreate(usersJobsSeeds),
      models.users_sources.bulkCreate(sourcesSeeds),
      models.post_offer.bulkCreate(postsOffersSeeds),
      models.post_stats.bulkCreate(postStatsSeeds),
      models.post_users_team.bulkCreate(postUsersTeamSeeds),
    ]);
  }

  static async initCommentSeeds() {
    await this.destroyTables();

    await this.seedMainTables();
  }

  static async resetOrganizationRelatedSeeds() {
    const tablesToInsert = [
      usersRepositories.Activity.getModelName(),
      usersRepositories.UsersTeam.getModelName(),
      organizationsRepositories.Main.getOrganizationsModelName(),
      postRepositories.MediaPosts.getModelName(),
    ];

    await this.destroyTables();
    await models.Users.bulkCreate(usersSeeds);
    await this.initTablesByList(tablesToInsert);
  }

  static async initSeeds() {
    await this.destroyTables();
    await this.seedDb();
  }

  static async initPostOfferSeeds() {
    await this.destroyTables();

    await models.Users.bulkCreate(usersSeeds);
    await models.organizations.bulkCreate(organizationsSeeds);
    await models.posts.bulkCreate(postsSeeds);
    await models.post_offer.bulkCreate(postsOffersSeeds);
    await models.post_users_team.bulkCreate(postUsersTeamSeeds);
  }

  public static async afterAllWithoutGraphQl() {
    const beforeAfterOptions = {
      isGraphQl: false,
    };

    return this.doAfterAll(beforeAfterOptions);
  }

  public static async afterAllWithGraphQl() {
    const beforeAfterOptions = {
      isGraphQl: true,
    };

    return this.doAfterAll(beforeAfterOptions);
  }

  public static async doAfterAll(
    options: any = null,
  ): Promise<void> {
    await this.sequelizeAfterAll();

    if (options && options.isGraphQl) {
      await GraphqlRequestHelper.afterAll();
    }
  }

  public static async sequelizeAfterAll() {
    await CloseHandlersHelper.closeDbConnections();

    await RabbitMqService.purgeAllQueues();
    await RabbitMqService.closeAll();
  }

  /**
   *
   * @param {Array} syncInit
   * @return {Promise<void>}
   * @private
   */
  static async initTablesByList(syncInit: any[]) {
    for (let i = 0; i < <number>syncInit.length; i += 1) {
      const table = syncInit[i];
      const seeds = tableToSeeds[table];

      if (seeds) {
        await models[table].bulkCreate(seeds);
      }
    }
  }

  private static async truncateEventsDb() {
    const tableName = 'entity_event_param';

    await knexEvents.raw(`TRUNCATE TABLE ${tableName}`);
  }
}

export = SeedsHelper;
