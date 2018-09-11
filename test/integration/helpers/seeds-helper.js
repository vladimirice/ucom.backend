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

// Truncated async
const minorTables = [
  'users_education',
  'users_jobs',
  'users_sources',
  'activity_user_post',
  'post_offer',
  'post_users_team',

  'comments',
  'post_stats',
  'activity_user_user',
];

// Truncated in order
const majorTables = [
  'posts',
  'Users',
];

class SeedsHelper {

  static async destroyTables() {

    // noinspection SqlResolve
    const allSequences = await models.sequelize.query(`SELECT sequence_name FROM information_schema.sequences;`);

    let resetSequencePromises = [];

    allSequences[0].forEach(data => {
      let name = data['sequence_name'];

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

  static async initSeedsForUsers() {
    await models['activity_user_user'].destroy({where: {}});
    await models['Users'].destroy({where: {}});
    await models.sequelize.query(`ALTER SEQUENCE activity_user_user_id_seq RESTART;`);
    await models.sequelize.query(`ALTER SEQUENCE "Users_id_seq" RESTART;`);

    await models['Users'].bulkCreate(usersSeeds);
  }

  static async seedDb() {
    await models['Users'].bulkCreate(usersSeeds);
    await models['posts'].bulkCreate(postsSeeds);

    await Promise.all([
      models['users_education'].bulkCreate(usersEducationSeeds),
      models['users_jobs'].bulkCreate(usersJobsSeeds),
      models['users_sources'].bulkCreate(sourcesSeeds),
      models['post_offer'].bulkCreate(postsOffersSeeds),
      models['post_stats'].bulkCreate(postStatsSeeds),
      models['post_users_team'].bulkCreate(postUsersTeamSeeds),
      models['comments'].bulkCreate(commentsSeeds),
    ]);
  }

  static async initSeeds() {
    await this.destroyTables();
    await this.seedDb();

    // TODO user sql reset instead
    usersSeeds.forEach(() => {
      models.sequelize.query(`SELECT nextval('"Users_id_seq"')`).then(() => {
      });
    });
  }

  static async initPostOfferSeeds() {
    await this.destroyTables();

    await models['Users'].bulkCreate(usersSeeds);
    await models['posts'].bulkCreate(postsSeeds);
    await models['post_offer'].bulkCreate(postsOffersSeeds);
    await models['post_users_team'].bulkCreate(postUsersTeamSeeds);

    usersSeeds.forEach(() => {
      models.sequelize.query(`SELECT nextval('"Users_id_seq"')`).then(() => {
      });
    });
  }


  static async sequelizeAfterAll() {
    await models.sequelize.close();
  }
}


module.exports = SeedsHelper;