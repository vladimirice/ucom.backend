const models = require('../../../models');
const usersSeeds = require('../../../seeders/users/users');
const usersJobsSeeds = require('../../../seeders/users/users_jobs');
const usersEducationSeeds = require('../../../seeders/users/users_education');
const sourcesSeeds = require('../../../seeders/users/users_sources');
const postsSeeds = require('../../../seeders/posts/posts');

class SeedsHelper {
  static async initSeeds() {
    await models['users_education'].destroy({where: {}});
    await models['users_jobs'].destroy({where: {}});
    await models['users_sources'].destroy({where: {}});
    await models['posts'].destroy({where: {}});
    await models['Users'].destroy({where: {}});

    await models['Users'].bulkCreate(usersSeeds);
    await models['users_education'].bulkCreate(usersEducationSeeds);
    await models['users_jobs'].bulkCreate(usersJobsSeeds);
    await models['users_sources'].bulkCreate(sourcesSeeds);
    await models['posts'].bulkCreate(postsSeeds);
  }

  static async sequelizeAfterAll() {
    await models.sequelize.close();
  }
}


module.exports = SeedsHelper;