module.exports = [
  {
    // id = 1
    description: 'thanks a lot for such cool post',
    commentable_id: 1,
    blockchain_status: 10,
    blockchain_id: 'sample_comment_blockchain_id1',
    parent_id: null,
    user_id: 3,
    path: [1],
  },
  {
    // id = 2
    description: 'I think this post is too verbose',
    commentable_id: 1,
    blockchain_status: 10,
    blockchain_id: 'sample_comment_blockchain_id2',
    parent_id: null,
    user_id: 4,
    path: [2],
  },
  {
    // id = 3
    description: 'Shut up! This is a cool post!',
    commentable_id: 1,
    blockchain_status: 10,
    blockchain_id: 'sample_comment_blockchain_id3',
    parent_id: 2,
    user_id: 2,
    path: [2,3],
  },
  {
    // id = 4
    description: 'Better for you to shut up!',
    commentable_id: 1,
    blockchain_status: 10,
    blockchain_id: 'sample_comment_blockchain_id4',
    parent_id: 3,
    user_id: 4,
    path: [2,3,4],
  }
];