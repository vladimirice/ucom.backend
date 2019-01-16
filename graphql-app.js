"use strict";
// const { GraphQLServer } = require('graphql-yoga');
// const getFieldNames = require('graphql-list-fields');
const { fieldsMap } = require('graphql-fields-list');
const { ApolloServer, gql } = require('apollo-server-express');
//
const typeDefs = gql `
  type Query {
    posts: posts!
    hello(name: String!): String!
    location: String!
  }

  type Post {
    id: ID!,
    name: String!
    comments: [Comment!]!
  }

  type Comment {
    id: ID!,
    name: String!
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
        posts(
        // @ts-ignore
        parent, 
        // @ts-ignore
        args, 
        // @ts-ignore
        ctx, 
        // @ts-ignore
        info) {
            // @ts-ignore
            const obj = gql `
        ${ctx.req.body.query}
      `;
            // @ts-ignore
            const map = fieldsMap(info);
            // @ts-ignore
            const a = 0;
            return {
                data: [
                    {
                        id: '1dsadsadas',
                        name: 'vlad',
                        comments: [
                            {
                                id: '32131221',
                                name: 'hello',
                            },
                        ],
                    },
                    {
                        id: '2dadsaddsadsadas',
                        name: 'jane',
                        comments: [
                            {
                                id: '32131221',
                                name: 'hello',
                            },
                        ],
                    },
                ],
                metadata: {
                    page: 1,
                    per_page: 10,
                    has_more: false,
                },
            };
        },
        hello(
        // @ts-ignore
        parent, args, 
        // @ts-ignore
        ctx, 
        // @ts-ignore
        info) {
            return `Welcome2, ${args.name}`;
        },
        location() {
            return 'Russia moscow';
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
module.exports = {
    app,
    server,
};
