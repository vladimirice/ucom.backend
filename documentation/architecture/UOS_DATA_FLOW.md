# UOS Data flow

![UOS data flow](https://raw.githubusercontent.com/UOSnetwork/ucom.backend/master/documentation/jpg/uos-data-flow.jpg)

UOS data flow description with an example use case:

**Part 1 - request**
* A user creates a new post.
* Client (web browser, mobile application) sends a request to the backend application.
* Backend application makes 4 different actions:
    * validates the request
    * saves post data (title, description, etc.) to the database
    * saves post creation event to the database
    * publish (produce) a `post is created` job to the RabbitMQ server

**Part 2 - Queue server**
* `Post is created` job is published to the `exchange.`
* Three queues receive the job (every queue receive a copy):
    * Blockchain transactions queue.
    * Post contents queue.
    * Notifications queue.
* Consumers of the given queues begin to process the job independently

**Part 3.1 - Blockchain transactions queue/consumer:**
* Receives the job from RabbitMQ.
* Finds the event in the events database and extracts blockchain transaction `post is created` signed by the client application.
* Pushes the signed transaction to the blockchain.
* Marks the event as `event which is pushed to the blockchain.`
* Acknowledges the message.

**Part 3.2 - Notifications queue/consumer:**
* Receives the job from RabbitMQ.
* Finds the event.
* Creates a notification for user's followers and saves it to the database.
* Pushes the notification to the Websocket server.
* Acknowledges the message.

**Part 3.3 - Post contents queue/consumer:**
* Receives the job from RabbitMQ.
* Finds the event and related post content (description)
* Parses the description
    * Extracts tags and creates new tags entities (for the new tags)
    * Extracts mentions and creates notification jobs no notify mentioned users.
* Acknowledges the message.

**Part 4 - Statistics/Analytics CRON worker.** 

A dedicated service which visits event database every 1-5 minutes and processes new events.

Kinds of processing:
* Aggregate statistics and save aggregates to the dedicated database.
* Calculate aggregates and denormalize them to the entities database. For example, calculate post upvotes.
