export {};

const helpers = require('../helpers');
const gen = require('../../generators');

const mockHelper = require('../helpers/mock-helper');

const { app, server } = require('../../../graphql-app');

require('cross-fetch/polyfill');
const apolloClient = require('apollo-boost').default;
const { gql } = require('apollo-boost');
const { InMemoryCache } = require('apollo-cache-inmemory');

mockHelper.mockAllTransactionSigning();
mockHelper.mockBlockchainPart();

let userVlad;
let userJane;

const JEST_TIMEOUT = 10000;

describe('#Feeds. #GraphQL', () => {
  beforeAll(async () => {
    [userVlad, userJane] = await helpers.SeedsHelper.beforeAllRoutine();
  });

  afterAll(async () => {
    await helpers.SeedsHelper.sequelizeAfterAll();
  });

  beforeEach(async () => {
    await helpers.Seeds.initUsersOnly();
  });

  describe('Users wall feed', () => {
    describe('Positive', () => {

      it('should get all user-related posts as Guest', async () => {
        const targetUser = userVlad;
        const directPostAuthor = userJane;

        const promisesToCreatePosts = [
          gen.Posts.createMediaPostByUserHimself(targetUser),
          gen.Posts.createUserDirectPostForOtherUser(directPostAuthor, targetUser, null, true),
        ];

        await Promise.all(promisesToCreatePosts);

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

        await helpers.Common.checkPostsListFromApi(
          data.user_wall_feed.data,
          promisesToCreatePosts.length,
          options,
        );

      }, JEST_TIMEOUT);
    });
  });
});
