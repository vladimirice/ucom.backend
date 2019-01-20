export {};
const { app, server } = require('../graphql-app');

const port = process.env.PORT || 4000; //

// eslint-disable-next-line no-console
app.listen({ port }, () => console.log(`🚀 Server ready at :${port}${server.graphqlPath}`));
