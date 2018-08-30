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
    return {
      'title': rate.title,
      'current_rate': rate.current_rate * EosImportance.getImportanceMultiplier(),
      'current_votes': rate.current_vote,
      'author': rate.User.first_name,
      'author_rate': rate.User.current_rate * EosImportance.getImportanceMultiplier()
    }
  });

  const usersData = await UsersRepository.findAllWithRates();

  const users = usersData.map(data => {
    return {
      'first_name': data.first_name,
      'account_name': data.account_name,
      'current_rate': data.current_rate * EosImportance.getImportanceMultiplier()
    }
  });

  res.send({
    'posts': posts,
    'users': users,
  });
});

async function updateRatesByBlockchain() {
  const importanceData = await EosImportance.getImportanceTableRows();

  let promises = [];

  await importanceData.forEach(async function(data) {
    let sql = '';

    if (data['acc_name'].startsWith("pst")) {
      const post = await PostsRepository.findOneByBlockchainId(data['acc_name']);


      // console.log(post);
//
      // sql = post ? post.title : 'no title';


      sql = `UPDATE "posts" SET current_rate = ${data['value']} WHERE blockchain_id = '${data["acc_name"]}'`;
    } else {
      // sql = `UPDATE "Users" SET current_rate = ${data['value']} WHERE account_name = '${data["acc_name"]}'`;
    }

    promises.push(sql);
  });

  console.log(promises);

  // return await Promise.all(promises);
}





module.exports = router;
