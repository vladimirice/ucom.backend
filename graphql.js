const { GraphQLServer } = require('graphql-yoga');

const typeDefs = `
  type Query {
    hello: String!
    location: String!
  }
`;

const resolvers = {
  Query: {
    hello() {
      return 'This is my first query';
    },
    location() {
      return 'Russia moscow'
    }
  }
};

const server = new GraphQLServer({
  typeDefs,
  resolvers,
});

server.start(() => {
  console.log('The server is up')
});
