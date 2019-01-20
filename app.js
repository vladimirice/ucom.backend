const express = require('express');
const path = require('path');

const { ApiLoggerStream, ApiLogger } = require('./config/winston');
const ApiErrorAndLoggingHelper = require('./lib/api/helpers/api-error-and-logging-helper');
const diContainerMiddleware = require('./lib/api/di-container-middleware');

const EosApi = require('./lib/eos/eosApi');

const usersRouter = require('./routes/users-route');
const authRouter = require('./routes/auth');
const myselfRouter = require('./routes/myself-router');
const postsRouter = require('./routes/posts/posts-router');
const registrationRouter = require('./routes/auth/registration');
const organizationsRouter = require('./routes/organizations/organizations-router');
const blockchainRouter = require('./routes/blockchain/blockchain-router');
const communityRouter = require('./routes/community-router');
const partnershipRouter = require('./routes/partnership-router');
const tagsRouter = require('./routes/tags/tags-router');

const app = express();

// only for autotests - check is file upload
if (process.env.NODE_ENV === 'test') {
  app.use(express.static(path.join(__dirname, 'public'))); // #task - separate server to serve static files
}

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(diContainerMiddleware);

// #task - very weak origin policy
app.use((req, res, next) => {
  // Website you wish to allow to connect
  res.setHeader('Access-Control-Allow-Origin', '*');

  // Request methods you wish to allow
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

  // Request headers you wish to allow
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type,Authorization');

  // Set to true if you need the website to include cookies in the requests sent
  // to the API (e.g. in case you use sessions)
  res.setHeader('Access-Control-Allow-Credentials', true);

  // Pass to next layer of middleware
  next();
});

EosApi.initTransactionFactory();

app.use('/api/v1/users', usersRouter);
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/myself', myselfRouter);
// noinspection JSCheckFunctionSignatures
app.use('/api/v1/posts', postsRouter);
app.use('/api/v1/auth/registration', registrationRouter);
app.use('/api/v1/organizations', organizationsRouter);
app.use('/api/v1/blockchain', blockchainRouter);
app.use('/api/v1/community', communityRouter);
app.use('/api/v1/partnership', partnershipRouter);
app.use('/api/v1/tags', tagsRouter);
require('./lib/auth/passport');

ApiErrorAndLoggingHelper.initAllForApp(app, ApiLogger, ApiLoggerStream);

module.exports = app;