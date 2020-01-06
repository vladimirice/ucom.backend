import { GraphQLError } from 'graphql';
import { BadRequestError } from '../../api/errors';
import { graphqlTypeDefs } from '../type-defs/graphql-type-defs';
import { resolvers } from '../resolvers/graphql-resolvers';

import CorsHelper = require('../../api/helpers/cors-helper');
import EosApi = require('../../eos/eosApi');

const cookieParser = require('cookie-parser');
const express = require('express');

const {
  ApolloServer,
  AuthenticationError,
  UserInputError,
} = require('apollo-server-express');

const { ApiLogger } = require('../../../config/winston');

const app = express();
app.use(cookieParser());

const server = new ApolloServer({
  typeDefs: graphqlTypeDefs,
  resolvers,
  context: ({ req, res }) => ({ req, res }),
  formatError: (error: GraphQLError) => {
    const { originalError } = error;

    const toLog = {
      message: error.message,
      graphqlError: error,
      source: error.source,
      originalError,
    };

    if (originalError && originalError instanceof BadRequestError) {
      error = new UserInputError(originalError.message);
    } else if (
      originalError
      // @ts-ignore
      && originalError.status === 401) {
      error = new AuthenticationError(originalError.message, 401);
    } else if (originalError && originalError.name === 'JsonWebTokenError') {
      error = new AuthenticationError('Invalid token', 401);
    } else if (!originalError
      // @ts-ignore
      || (originalError.status && originalError.status === 500)
      || originalError instanceof Error) {
      ApiLogger.error(toLog);

      error.message = 'Internal server error';
    } else {
      ApiLogger.warn(toLog);
    }

    if (error.extensions) {
      delete error.extensions.exception;
    }

    if (error.message && error.extensions) {
      error.extensions.message = error.message;
    }

    return error;
  },
});

// #task - working only with this two assignations. Required to research
CorsHelper.addCorsLibMiddleware(app);
CorsHelper.addRegularCors(app);
EosApi.initBlockchainLibraries();

// it is required to pass cors = false in order to avoid reassign origin to *
server.applyMiddleware({ app, cors: false });

export {
  app,
  server,
};
