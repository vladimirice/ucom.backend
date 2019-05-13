"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const EnvHelper = require("../../common/helper/env-helper");
const ConsoleHelper = require("../../common/helper/console-helper");
const { app } = require('../applications/graphql-application');
const port = EnvHelper.getPortOrException();
app.listen({ port }, () => ConsoleHelper.printApplicationIsStarted(port));
