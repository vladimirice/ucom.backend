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


  let postsHtml = '<h2>Posts ratings</h2>';

  const tdStyle = 'border: 1px solid black';

  postsHtml += '<table>';
  postsHtml += '<tr>';
  postsHtml += `<td style="${tdStyle}"><b>Post title</b></td>`;
  postsHtml += `<td style="${tdStyle}"><b>Post current rate</b></td>`;
  postsHtml += `<td style="${tdStyle}"><b>Post current votes</b></td>`;
  postsHtml += `<td style="${tdStyle}"><b>Post author</b></td>`;
  postsHtml += `<td style="${tdStyle}"><b>Post author rate</b></td>`;
  postsHtml += '</tr>';

  for (let i = 0; i < posts.length; i++) {
    const post = posts[i];
    postsHtml += `<tr>`;
    postsHtml += `<td style="${tdStyle}">${post['title']}</td>`;
    postsHtml += `<td style="${tdStyle}">${post['current_rate']}</td>`;
    postsHtml += `<td style="${tdStyle}">${post['current_votes']}</td>`;
    postsHtml += `<td style="${tdStyle}">${post['author']}</td>`;
    postsHtml += `<td style="${tdStyle}">${post['author_rate']}</td>`;

    postsHtml += `</tr>`;
  }

  postsHtml += '</table>';

  res.send(postsHtml);


  // res.send({
  //   'posts': posts,
  //   'users': users,
  // });
});

module.exports = router;
