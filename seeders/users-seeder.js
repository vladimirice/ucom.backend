const usersSeeds = require('./users/users');
const usersEducationSeeds = require('./users/users_education');
const usersJobsSeeds = require('./users/users_jobs');
const sourcesSeeds = require('./users/users_sources');
const postsSeeds = require('./posts/posts');
const postOfferSeeds = require('./posts/posts-offers');
const postUsersTeamSeeds = require('./posts/posts-users-team');
const commentsSeeds = require('./comments/comments-seeds');

module.exports = {
  up: (queryInterface) => {
    return queryInterface.bulkInsert('Users', usersSeeds, {})
      .then(() => {
        return queryInterface.bulkInsert('users_education', usersEducationSeeds, {})
      })
      .then(() => {
        return queryInterface.bulkInsert('users_jobs', usersJobsSeeds, {})
      })
      .then(() => {
        return queryInterface.bulkInsert('users_sources', sourcesSeeds, {})
      })
      .then(() => {
        return queryInterface.bulkInsert('posts', postsSeeds, {})
      })
      .then(() => {
        return queryInterface.bulkInsert('post_offer', postOfferSeeds, {})
      })
      .then(() => {
        return queryInterface.bulkInsert('post_users_team', postUsersTeamSeeds, {})
      })
      .then(() => {
        return queryInterface.bulkInsert('comments', commentsSeeds, {})
      })
      .catch((err) => {
        throw new Error(err);
      });
  },

  down: (queryInterface) => {
    throw new Error('not supported');
  }
};
