const ActivityProducer = require('./lib/jobs/activity-producer');
ActivityProducer.publish('Hello from producer', 'content-creation').then();