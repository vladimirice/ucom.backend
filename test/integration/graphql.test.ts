export {};

const { app, server } = require('../../graphql-app');

require('cross-fetch/polyfill');
const apolloClient = require('apollo-boost').default;
const { gql } = require('apollo-boost');

// app.listen({ port: 4010 }, () =>
//   console.log(`🚀 Server ready at http://173.18.212.40:4010${server.graphqlPath}`),
// );

test('[Smoke] - test grapql env', async () => {
  await app.listen({ port: 4000 });

  const client = new apolloClient({
    request: async (operation) => {
      operation.setContext({
        headers: {
          authorization: 'randomToken',
        },
      });
    },
    uri: `http://127.0.0.1:4000${server.graphqlPath}`,
  });

  const query = gql`
query {
  user_wall_feed(user_id: 1, page: 1, per_page: 3) {
    data {
     id
     title
    },
    metadata {
      page
      per_page
      has_more
    }
  }
}
    `;

  // @ts-ignore
  const response = await client.query({ query });

  expect(response.data).toBe('Welcome, admin');
});
