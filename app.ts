const API_V1_PREFIX = '/api/v1';

const { CommonHeaders } = require('ucom.libs.common').Common.Dictionary;

const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');

const { ApiLoggerStream, ApiLogger } = require('./config/winston');
const ApiErrorAndLoggingHelper = require('./lib/api/helpers/api-error-and-logging-helper');
const diContainerMiddleware = require('./lib/api/di-container-middleware');

const EosApi = require('./lib/eos/eosApi');

const usersRouter = require('./routes/users-route');
const usersV2Router = require('./routes/users-route-v2');

const authRouter = require('./routes/auth');
const myselfRouter = require('./routes/myself-router');
const postsRouter = require('./routes/posts/posts-router');
const postsV2Router = require('./routes/posts/posts-v2-router');
const registrationRouter = require('./routes/auth/registration');
const organizationsRouter = require('./routes/organizations/organizations-router');
const organizationsV2Router = require('./routes/organizations/organizations-v2-router');
const blockchainRouter = require('./routes/blockchain/blockchain-router');
const communityRouter = require('./routes/community-router');
const partnershipRouter = require('./routes/partnership-router');
const tagsRouter = require('./routes/tags/tags-router');
const StatsRouter = require('./lib/stats/router/stats-router');

const GithubAuthRouter = require('./lib/github/router/github-auth-router');
const GithubAuthMockRouter = require('./lib/github/router/github-auth-mock-router');
const AirdropsUserRouter = require('./lib/airdrops/router/airdrops-user-router');

const UsersExternalRouter = require('./lib/users-external/router/users-external-router');

const app = express();

// only for autotests - check is file upload
if (process.env.NODE_ENV === 'test') {
  app.use(express.static(path.join(__dirname, 'public'))); // #task - separate server to serve static files
}

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(diContainerMiddleware);

// #task - very weak origin policy
// @ts-ignore
app.use((req, res, next) => {
  // Website you wish to allow to connect
  res.setHeader('Access-Control-Allow-Origin', '*');

  // Request methods you wish to allow
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

  // Request headers you wish to allow
  res.setHeader(
    'Access-Control-Allow-Headers',
    `X-Requested-With,content-type,Authorization,${CommonHeaders.TOKEN_USERS_EXTERNAL_GITHUB}`,
  );

  // Set to true if you need the website to include cookies in the requests sent
  // to the API (e.g. in case you use sessions)
  res.setHeader('Access-Control-Allow-Credentials', true);

  // Pass to next layer of middleware
  next();
});

EosApi.initTransactionFactory();

app.use(cookieParser());
ApiErrorAndLoggingHelper.initBeforeRouters(app, ApiLogger, ApiLoggerStream);

app.use('/api/v1/users', usersRouter);
app.use('/api/v2/users', usersV2Router);

app.use('/api/v1/auth', authRouter);
app.use('/api/v1/myself', myselfRouter);
app.use('/api/v1/posts', postsRouter);
app.use('/api/v1/auth/registration', registrationRouter);

app.use('/api/v1/organizations', organizationsRouter);
app.use('/api/v2/organizations', organizationsV2Router);

app.use('/api/v1/blockchain', blockchainRouter);
app.use('/api/v1/community', communityRouter);
app.use('/api/v1/partnership', partnershipRouter);
app.use('/api/v1/tags', tagsRouter);
app.use('/api/v1/stats', StatsRouter);
app.use('/api/v1/github', GithubAuthRouter);
app.use('/github-auth-mock', GithubAuthMockRouter);
app.use('/api/v1/airdrops', AirdropsUserRouter);
app.use(`${API_V1_PREFIX}/users-external`, UsersExternalRouter);

// V2 for post
app.use('/api/v2/posts', postsV2Router);

require('./lib/auth/passport');

ApiErrorAndLoggingHelper.initErrorHandlers(app);

module.exports = app;
