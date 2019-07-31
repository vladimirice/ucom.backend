"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const errors_1 = require("../../api/errors");
const graphql_type_defs_1 = require("../type-defs/graphql-type-defs");
const graphql_resolvers_1 = require("../resolvers/graphql-resolvers");
const CorsHelper = require("../../api/helpers/cors-helper");
const EosApi = require("../../eos/eosApi");
const cookieParser = require('cookie-parser');
const express = require('express');
const { ApolloServer, AuthenticationError, UserInputError, } = require('apollo-server-express');
const { ApiLogger } = require('../../../config/winston');
const app = express();
exports.app = app;
app.use(cookieParser());
const server = new ApolloServer({
    typeDefs: graphql_type_defs_1.graphqlTypeDefs,
    resolvers: graphql_resolvers_1.resolvers,
    context: ({ req, res }) => ({ req, res }),
    formatError: (error) => {
        const { originalError } = error;
        const toLog = {
            message: error.message,
            graphqlError: error,
            source: error.source,
            originalError,
        };
        if (originalError && originalError instanceof errors_1.BadRequestError) {
            error = new UserInputError(originalError.message);
        }
        else if (originalError
            // @ts-ignore
            && originalError.status === 401) {
            error = new AuthenticationError(originalError.message, 401);
        }
        else if (originalError && originalError.name === 'JsonWebTokenError') {
            error = new AuthenticationError('Invalid token', 401);
        }
        else if (!originalError
            // @ts-ignore
            || (originalError.status && originalError.status === 500)
            || originalError instanceof Error) {
            ApiLogger.error(toLog);
            error.message = 'Internal server error';
        }
        else {
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
exports.server = server;
// #task - working only with this two assignations. Required to research
CorsHelper.addCorsLibMiddleware(app);
CorsHelper.addRegularCors(app);
EosApi.initBlockchainLibraries();
// it is required to pass cors = false in order to avoid reassign origin to *
server.applyMiddleware({ app, cors: false });
