const Consumer = require('../lib/entities/job').NotificationsConsumer;

Consumer.consume().then(() => {
  console.log(`Notifications consumer is started`);
});