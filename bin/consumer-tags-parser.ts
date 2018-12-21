const consumer = require('../lib/tags/job/consumer-tags-parser');

(async () => {
  try {
    const res = await consumer.consume();
    console.log(
      `Consumer tags parser is started. Response from start is ${JSON.stringify(res, null, 2)}`,
    );
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
