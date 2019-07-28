# Services and applications

Applications:
* Websockets - to notify about a new notifications
* Uploader - to upload an image and receive absolute URL for it.
* GraphQL API - to fetch data
* REST API - for the CRUD operations
* iframely - youtube iframe processor
* server-side rendering frontend application (see `ucom.frontend`)
* redirect - a redirect part of the affiliate program.

Consumers (queue):
* Push already signed transactions to the blockchain
* Parse tags and mentions from posts and comments descriptions.
* Send notifications about the events like 'User follows you' or 'User upvotes your post' and so on.

Background processes (CRON-like)
* Tags and mentions for posts and comments - calculate importance. A consumer parses them (see above)
* Other entities importance - background updating
* Blockchain nodes voting and background voting state updating
* Fetch latest wallet transactions from blockchain and update a cache for the activity table
* Save current entities parameters like importance for the statistics
* Calculate deltas of current entities parameters - a delta of 24 hours
* GitHub airdrop tokens sender
* Fetch and save UOS accounts properties, for example, scaled_importance. Is used for the governance

All of these processes are listed in PM2 ecosystem config files, for [staging](../../ecosystem-staging.config.js),
for [production](../../ecosystem-production.config.js)
