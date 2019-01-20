"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const { app, server } = require('../graphql-app');
const port = process.env.PORT || 4000; //
// eslint-disable-next-line no-console
app.listen({ port }, () => console.log(`🚀 Server ready at :${port}${server.graphqlPath}`));
