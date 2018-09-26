const createError = require('http-errors');
require('express-async-errors');
const express = require('express');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const path = require('path');
const winston = require('./config/winston');

global.reqlib = require('app-root-path').require;

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users-route');
const authRouter = require('./routes/auth');
const myselfRouter = require('./routes/myself');
const postsRouter = require('./routes/posts/posts-router');
const registrationRouter = require('./routes/auth/registration');
const organizationsRouter = require('./routes/organizations/organizations-router');
const blockchainRouter = require('./routes/blockchain/blockchain-router');
const errorMiddleware = require('./lib/api/error-middleware');
const diContainerMiddleware = require('./lib/api/di-container-middleware');
const EosApi = require('./lib/eos/eosApi');

const app = express();

process.on('uncaughtException', (ex) => { winston.error(ex); });
process.on('unhandledRejection', (ex) => { throw ex; });

app.use(morgan('combined', { stream: winston.stream }));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(diContainerMiddleware);

app.use(express.static(path.join(__dirname, 'public')));

app.use(function (req, res, next) {

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

app.use('/api/v1', indexRouter);
app.use('/api/v1/users', usersRouter);
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/myself', myselfRouter);
// noinspection JSCheckFunctionSignatures
app.use('/api/v1/posts', postsRouter);
app.use('/api/v1/auth/registration', registrationRouter);
app.use('/api/v1/organizations', organizationsRouter);
app.use('/api/v1/blockchain', blockchainRouter);
require('./lib/auth/passport');

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

app.use(errorMiddleware);


module.exports = app;
