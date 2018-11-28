const Consumer = require('../lib/entities/job').NotificationsConsumer;

Consumer.consume().then(() => {
  console.log(`Notifications consumer is started`);
}).catch(() => {
  console.error('An error is occurred. See logs');
  process.exit(1);
});