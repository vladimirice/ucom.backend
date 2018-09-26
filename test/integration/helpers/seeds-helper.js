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
const UsersHelper = require('../helpers/users-helper');

const OrganizationsRepositories = require('../../../lib/organizations/repository');
const UsersRepositories = require('../../../lib/users/repository');

const seedsDir = '../../../seeders';

const tableToSeeds = {
  [OrganizationsRepositories.Main.getOrganizationsModelName()] : require(`${seedsDir}/organizations/organizations-seeds`),
  [UsersRepositories.Main.getUsersModelName()] : require(`${seedsDir}/users/users`),
};

// Truncated async
const minorTables = [
  UsersRepositories.Activity.getModelName(),
  UsersRepositories.UsersTeam.getModelName(),
  'post_ipfs_meta',

  'users_education',
  'users_jobs',
  'users_sources',

  'post_offer',
  'post_users_team',

  'post_stats',

  'activity_user_user',
  'activity_user_post',
  'activity_user_comment'
];

// Truncated in order
const majorTables = [
  'organizations',
  'comments',
  'posts',
  'Users',
];

class SeedsHelper {

  static async beforeAllRoutine() {
    await this.destroyTables();

    const usersModel = UsersRepositories.Main.getUsersModelName();

    // init users
    const usersSequence = this.getSequenceNameByModelName(usersModel);
    const usersSeeds    = tableToSeeds[usersModel];

    await this._resetSequence(usersSequence);
    await this._bulkCreate(usersModel, usersSeeds);

    return await Promise.all([
        UsersHelper.getUserVlad(),
        UsersHelper.getUserJane(),
        UsersHelper.getUserPetr(),
        UsersHelper.getUserRokky(),
      ]);
  }

  /**
   *
   * @param {string} name
   * @return {string}
   */
  static getSequenceNameByModelName(name) {
    if (name === UsersRepositories.Main.getUsersModelName()) {
      return '"Users_id_seq"';
    }

    return `${name}_id_seq`;
  }

  static async _resetSequence(name) {
    return models.sequelize.query(`ALTER SEQUENCE ${name} RESTART;`);
  }

  static async _bulkCreate(name, seeds) {
    return models[name].bulkCreate(seeds)
  }

  static async destroyTables() {

    // noinspection SqlResolve
    const allSequences = await models.sequelize.query(`SELECT sequence_name FROM information_schema.sequences;`);

    let resetSequencePromises = [];

    allSequences[0].forEach(data => {
      let name = data.sequence_name;

      if (name === 'Users_id_seq') {
        name = '"Users_id_seq"';
      }

      resetSequencePromises.push(models.sequelize.query(`ALTER SEQUENCE ${name} RESTART;`));
    });

    await Promise.all(resetSequencePromises);

    const params = {where: {}};

    const minorTablesPromises = [];

    minorTables.forEach(table => {
      minorTablesPromises.push(models[table].destroy(params));
    });

    await Promise.all(minorTablesPromises);

    for (let i = 0; i < majorTables.length; i++) {
      await models[majorTables[i]].destroy(params);
    }
  }

  /**
   *
   * @param {string} tableName
   * @returns {Promise<void>}
   */
  static async truncateTable(tableName) {
    await models[tableName].destroy({where: {}});
  }

  static async initSeedsForUsers() {
    await models.activity_user_user.destroy({where: {}});
    await models.posts.destroy({where: {}});
    await models.Users.destroy({where: {}});

    await models.sequelize.query(`ALTER SEQUENCE activity_user_user_id_seq RESTART;`);
    await models.sequelize.query(`ALTER SEQUENCE "Users_id_seq" RESTART;`);
    await models.sequelize.query(`ALTER SEQUENCE posts_id_seq RESTART;`);

    await models.Users.bulkCreate(usersSeeds);
    await models.posts.bulkCreate(postsSeeds);
  }

  static async seedMainTables() {
    await models.Users.bulkCreate(usersSeeds);
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
    const tables = [
      UsersRepositories.Activity.getModelName(),
      UsersRepositories.UsersTeam.getModelName(),
      OrganizationsRepositories.Main.getOrganizationsModelName(),
    ];

    await this._truncateTablesByList(tables);
    await this._initTablesByList(tables, []);
  }

  static async initSeeds() {
    await this.destroyTables();
    await this.seedDb();
  }

  static async initPostOfferSeeds() {
    await this.destroyTables();

    await models.Users.bulkCreate(usersSeeds);
    await models.posts.bulkCreate(postsSeeds);
    await models.post_offer.bulkCreate(postsOffersSeeds);
    await models.post_users_team.bulkCreate(postUsersTeamSeeds);

    // noinspection JSUnresolvedFunction
    usersSeeds.forEach(() => {
      models.sequelize.query(`SELECT nextval('"Users_id_seq"')`).then(() => {
      });
    });
  }


  static async sequelizeAfterAll() {
    await models.sequelize.close();
  }


  /**
   *
   * @param {Array} tables
   * @return {Promise<void>}
   */
  static async _truncateTablesByList(tables) {
    const params = {where: {}};

    let promises = [];

    tables.forEach(table => {
      promises.push(models[table].destroy(params));

      const sequenceName = SeedsHelper.getSequenceNameByModelName(table);
      promises.push(models.sequelize.query(`ALTER SEQUENCE ${sequenceName} RESTART;`))
    });

    await Promise.all(promises);
  }

  /**
   *
   * @param {Array} syncInit
   * @param {Array} asyncInit
   * @return {Promise<void>}
   * @private
   */
  static async _initTablesByList(syncInit, asyncInit) {

    for (let i = 0; i < syncInit.length; i++) {
      const table = syncInit[i];
      const seeds = tableToSeeds[table];

      if (seeds) {
        await models[table].bulkCreate(seeds);
      }
    }
  }
}


module.exports = SeedsHelper;