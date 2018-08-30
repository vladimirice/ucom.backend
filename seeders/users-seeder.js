const usersSeeds = require('./users/users');
const usersEducationSeeds = require('./users/users_education');
const usersJobsSeeds = require('./users/users_jobs');
const sourcesSeeds = require('./users/users_sources');
const postsSeeds = require('./posts/posts');
const postOfferSeeds = require('./posts/posts-offers');


module.exports = {
  up: (queryInterface, Sequelize) => {
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
      .catch((err) => {
        throw new Error(err);
      });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('users_education', null, {})
      .then(() => {
        return queryInterface.bulkDelete('users_jobs', null, {})
      })
      .then(() => {
        return queryInterface.bulkDelete('users_sources', null, {})
      })
      .then(() => {
        return queryInterface.bulkDelete('posts', null, {})
      })
      .then(() => {
        return queryInterface.bulkDelete('Users', null, {})
      })
      .catch((err) => {
        throw new Error(err);
      });
  }
};
