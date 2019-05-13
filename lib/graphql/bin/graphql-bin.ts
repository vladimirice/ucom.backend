import EnvHelper = require('../../common/helper/env-helper');
import ConsoleHelper = require('../../common/helper/console-helper');

const { app } = require('../applications/graphql-application');

const port = EnvHelper.getPortOrException();

app.listen({ port }, () => ConsoleHelper.printApplicationIsStarted(port));

export {};
