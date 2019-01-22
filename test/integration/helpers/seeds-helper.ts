/* tslint:disable:max-line-length */
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
const usersHelper = require('../helpers/users-helper');

const organizationsRepositories = require('../../../lib/organizations/repository');
const usersRepositories = require('../../../lib/users/repository');
const postRepositories = require('../../../lib/posts/repository');
const usersModelProvider =  require('../../../lib/users/service').ModelProvider;
const entityModelProvider = require('../../../lib/entities/service').ModelProvider;

const rabbitMqService     = require('../../../lib/jobs/rabbitmq-service.js');

const seedsDir = '../../../seeders';

const tableToSeeds = {
  [organizationsRepositories.Main.getOrganizationsModelName()]: require(`${seedsDir}/organizations/organizations-seeds`),
  [usersRepositories.Main.getUsersModelName()]:                 require(`${seedsDir}/users/users`),
  [usersModelProvider.getUsersTeamTableName()]:                 require(`${seedsDir}/users/users-team-seeds`),
  [postRepositories.MediaPosts.getModelName()]:                 require(`${seedsDir}/posts/posts`),
};

// Truncated async
const minorTables = [
  entityModelProvider.getNotificationsTableName(),
  usersRepositories.UsersTeam.getModelName(),

  'entity_tags',
  'entity_state_log',
  'tags',
  'entity_event_param',
  'entity_stats_current',
  'blockchain_tr_traces',

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
  usersRepositories.Activity.getModelName(),
  'comments',
  'posts',
  'organizations',
  'Users',

  'tags',
];

class SeedsHelper {

  static async bulkCreateComments() {
    await this.bulkCreate('comments', commentsSeeds);
  }

  /**
   *
   * @param {Object} user
   * @return {Promise<Object>}
   */
  static async createMediaPostWithoutOrg(user) {
    const data = {
      post_type_id: 1,
      title: 'EOS core library update',
      description: 'We are happy to announce a new major version of our EOS core library. A several cool features are successfully implemented',
      main_image_filename: 'sample_filename_1.jpg',
      user_id: user.id,
      leading_text: 'Special update for our EOS people',
      created_at: new Date(),
      updated_at: new Date(),
      blockchain_id: 'sample_post_blockchain_id',
    };

    const model = await models['posts'].create(data);

    return model.toJSON();
  }

  /**
   *
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
    };

    const model = await models['comments'].create(data);

    return model.toJSON();
  }

  /**
   *
   * @returns {Promise<void>}
   */
  static async purgeAllQueues() {
    await rabbitMqService.purgeAllQueues();
  }

  /**
   *
   * @returns {Promise<*>}
   */
  static async beforeAllRoutine() {
    await Promise.all([
      this.destroyTables(),
      this.purgeAllQueues(),
    ]);

    const usersModel = usersRepositories.Main.getUsersModelName();

    // init users
    const usersSequence = this.getSequenceNameByModelName(usersModel);
    const usersSeeds    = tableToSeeds[usersModel];

    await this.resetSequence(usersSequence);
    await this.bulkCreate(usersModel, usersSeeds);

    await Promise.all([
      models.users_education.bulkCreate(usersEducationSeeds),
      models.users_jobs.bulkCreate(usersJobsSeeds),
      models.users_sources.bulkCreate(sourcesSeeds),
    ]);

    return await Promise.all([
      usersHelper.getUserVlad(),
      usersHelper.getUserJane(),
      usersHelper.getUserPetr(),
      usersHelper.getUserRokky(),
    ]);
  }

  public async seedOrganizations() {
    await models.organizations.bulkCreate(organizationsSeeds);
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

  static async resetSequence(name) {
    return models.sequelize.query(`ALTER SEQUENCE ${name} RESTART;`);
  }

  static async bulkCreate(name, seeds) {
    return models[name].bulkCreate(seeds);
  }

  static async destroyTables() {

    // noinspection SqlResolve
    const allSequences = await models.sequelize.query('SELECT sequence_name FROM information_schema.sequences;');

    const resetSequencePromises: any = [];

    allSequences[0].forEach((data) => {
      let name = data.sequence_name;

      if (name === 'Users_id_seq') {
        name = '"Users_id_seq"';
      }

      resetSequencePromises.push(models.sequelize.query(`ALTER SEQUENCE ${name} RESTART;`));
    });

    await Promise.all(resetSequencePromises);

    const minorTablesPromises: any = [];

    minorTables.forEach((table) => {
      minorTablesPromises.push(models.sequelize.query(`DELETE FROM ${table} WHERE 1=1`));
    });

    await Promise.all(minorTablesPromises);

    for (let i = 0; i < majorTables.length; i += 1) {
      await models.sequelize.query(`DELETE FROM "${majorTables[i]}" WHERE 1=1`);
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

    // noinspection JSUnresolvedFunction
    usersSeeds.forEach(() => {
      // tslint:disable-next-line
      models.sequelize.query(`SELECT nextval('"Users_id_seq"')`).then(() => {
      });
    });
  }

  static async doAfterAll() {
    await Promise.all([
      // rabbitMqService.closeAll(),
      models.sequelize.close(),
    ]);
  }

  static async sequelizeAfterAll() {
    models.sequelize.close();
  }

  /**
   *
   * @param {Array} syncInit
   * @return {Promise<void>}
   * @private
   */
  static async initTablesByList(syncInit) {

    for (let i = 0; i < syncInit.length; i += 1) {
      const table = syncInit[i];
      const seeds = tableToSeeds[table];

      if (seeds) {
        await models[table].bulkCreate(seeds);
      }
    }
  }
}

export = SeedsHelper;
