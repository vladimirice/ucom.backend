// const { GraphQLServer } = require('graphql-yoga');
// const getFieldNames = require('graphql-list-fields');

const { fieldsMap } = require('graphql-fields-list');

const { ApolloServer, gql } = require('apollo-server-express');

const postsFetchService = require('./lib/posts/service/posts-fetch-service');

const typeDefs = gql`
  type Query {
    user_wall_feed(user_id: Int!, page: Int!, per_page: Int!): posts!
  }

  type Post {
    id: ID!,
    title: String
    description: String
    comments: [Comment!]
  }

  type Comment {
    id: ID!,
    title: String!
  }

  type posts {
    data: [Post!]!
    metadata: metadata!
  }

  type comments {
    data: [Comment!]!
    metadata: metadata!
  }

  type metadata {
    page: Int!,
    per_page: Int!,
    has_more: Boolean!
  }
`;

const resolvers = {
  Query: {
    async user_wall_feed(
      // @ts-ignore
      parent,
      // @ts-ignore
      args,
      // @ts-ignore
      ctx,
      // @ts-ignore
      info,
    ) {

      // TODO
      // @ts-ignore
      const map = fieldsMap(info);

      const currentUserId: number = 1;

      return await postsFetchService.findAndProcessAllForUserWallFeed(args.user_id, currentUserId, {
        page:     args.page,
        per_page: args.per_page,
      });
    },
  },
};

const express = require('express');

const app = express();
const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: ({ req }) => {
    return { req };
  },
});

server.applyMiddleware({ app });

export = {
  app,
  server,
};
