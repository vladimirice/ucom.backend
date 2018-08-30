const express = require('express');
const router = express.Router();
const EosImportance = require('../lib/eos/eos-importance');
const PostsRepository = require('../lib/posts/posts-repository');
const UsersRepository = require('../lib/users/users-repository');

/* GET home page. */
router.get('/', async function(req, res) {
  // await getPromise();
  throw new Error('User not found');
});

router.get('/rates', async function(req, res) {
  const postsData = await PostsRepository.findAllWithRates();

  const posts = postsData.map(rate => {

    let current_rate = rate.current_rate * EosImportance.getImportanceMultiplier();
    let author_current_rate = rate.User.current_rate * EosImportance.getImportanceMultiplier();

    return {
      'title': rate.title,
      'current_rate': current_rate.toFixed(),
      'current_votes': rate.current_vote,
      'author': rate.User.first_name,
      'author_rate': author_current_rate.toFixed()
    }
  });

  const usersData = await UsersRepository.findAllWithRates();

  const users = usersData.map(data => {

    let current_rate = data.current_rate * EosImportance.getImportanceMultiplier();

    return {
      'first_name': data.first_name,
      'account_name': data.account_name,
      'current_rate': current_rate.toFixed()
    }
  });

  res.send({
    'posts': posts,
    'users': users,
  });
});

module.exports = router;
