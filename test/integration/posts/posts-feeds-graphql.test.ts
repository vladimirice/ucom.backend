export {};

const mockHelper = require('../helpers/mock-helper');

const { app, server } = require('../../../graphql-app');

const postsGenerator    = require('../../generators/posts-generator');
const commentsGenerator = require('../../generators/comments-generator');

const seedsHelper   = require('../helpers/seeds-helper');
const commonHelper  = require('../helpers/common-helper');
const commentsHelper  = require('../helpers/comments-helper');

require('cross-fetch/polyfill');
const apolloClient = require('apollo-boost').default;
const { gql } = require('apollo-boost');
const { InMemoryCache } = require('apollo-cache-inmemory');

mockHelper.mockAllTransactionSigning();
mockHelper.mockBlockchainPart();

let userVlad;
let userJane;

const JEST_TIMEOUT = 20000;

describe('#Feeds. #GraphQL', () => {
  beforeAll(async () => {
    [userVlad, userJane] = await seedsHelper.beforeAllRoutine();
  });

  afterAll(async () => {
    await seedsHelper.sequelizeAfterAll();
  });

  beforeEach(async () => {
    await seedsHelper.initUsersOnly();
  });

  describe('Users wall feed', () => {
    describe('Positive', () => {

      it('#smoke - should get all user-related posts as Guest', async () => {
        const targetUser = userVlad;
        const directPostAuthor = userJane;

        const promisesToCreatePosts = [
          postsGenerator.createMediaPostByUserHimself(targetUser),
          postsGenerator.createUserDirectPostForOtherUser(directPostAuthor, targetUser, null, true),
        ];

        const [postOneId, postTwo] = await Promise.all(promisesToCreatePosts);

        const [commentOne] = await Promise.all([
          commentsGenerator.createCommentForPost(
            postOneId,
            userJane,
            'Jane comments - for post one',
          ),
          commentsGenerator.createCommentForPost(postOneId, userJane, 'Comment two for post two'),
          commentsGenerator.createCommentForPost(postTwo.id, userJane, 'Comment two for post two'),
        ]);

        await commentsHelper.requestToUpvoteComment(postOneId, commentOne.id, userVlad);

        const serverApp = await app.listen({ port: 4001 });

        const client = new apolloClient({
          request: async (operation) => {
            operation.setContext({
              headers: {
                Authorization: `Bearer ${userVlad.token}`,
              },
            });
          },
          uri: `http://127.0.0.1:4001${server.graphqlPath}`,
          cache: new InMemoryCache({
            addTypename: false,
          }),
        });

        const query = gql`
query {
  user_wall_feed(user_id: 1, page: 1, per_page: 3) {
    data {
     id
     title
     post_type_id
     leading_text
     description
     user_id
     blockchain_id

     created_at
     updated_at

     main_image_filename
     entity_images


     comments_count
     current_vote
     current_rate

     entity_id_for
     entity_name_for

     organization_id

     comments {
      data {
        id
        description
        current_vote

        User {
          id
          account_name
          first_name
          last_name
          nickname
          avatar_filename
          current_rate
        }

        blockchain_id
        commentable_id
        created_at
        activity_user_comment
        organization

        depth
        myselfData {
          myselfVote
        }
        organization_id
        parent_id
        path
        updated_at
        user_id
      }
      metadata {
        page
        per_page
        has_more
      }
     }

     myselfData {
      myselfVote
      join
      organization_member
     }

     User {
      id
      account_name
      first_name
      last_name
      nickname
      avatar_filename
      current_rate
     }
   }

    metadata {
      page
      per_page
      has_more
    }
  }
}
    `;

        /*

             comments(parent_id: 10, page: 2, per_page: 5) {
      data: {
        id
        description
        metadata {
          total_amount: 0
        }

        comments: {
          id
          description
        }
      },
      metadata {
        has_more
      }

         */

        const response = await client.query({ query });
        // @ts-ignore
        const data = response.data;

        // @ts-ignore
        const options = {
          myselfData: true,
          postProcessing: 'list',
          comments: true,
        };

        await serverApp.close();

        await commonHelper.checkPostsListFromApi(
          data.user_wall_feed.data,
          promisesToCreatePosts.length,
          options,
        );

      }, JEST_TIMEOUT);
    });
  });
});
