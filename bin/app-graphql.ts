const { GraphQLServer } = require('graphql-yoga');

const typeDefs = `
  type Query {
    hello(name: String!): String!
    location: String!
  }
`;

const resolvers = {
  Query: {
    hello(
      // @ts-ignore
      parent,
      args,
      // @ts-ignore
      ctx,
      // @ts-ignore
      info,
    ) {
      return `Welcome, ${args.name}`;
    },
    location() {
      return 'Russia moscow';
    },
  },
};

const server = new GraphQLServer({
  typeDefs,
  resolvers,
});

const graphQlPort = process.env.PORT || 4000;

server.start(
  { port: graphQlPort },
  () => console.log(`The server is running on port ${graphQlPort}`));
