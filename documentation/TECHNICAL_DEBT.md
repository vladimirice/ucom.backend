# Technical debt

## Unused methods
* It is required to remove any unused methods and rename the methods with `v2`. They were used for backward compatibility.

## Refactor legacy implementations
* organizations lists - fetch these only via knex. Use sequelize only for join for legacy models.
* error-middleware for string errors - correct processing

## Fix architectural errors
* event_id is not filled for all `users_activity` so it is not convenient to use event_id for all cases.
* `users_activity` table - a mix of type, group, event_id, entity_id_for, entity_name etc fields. It will be better to use the JSON
field and a couple of aggregations
* MongoDb sync worker (`blockchain_tr_traces` table). It operates the mongo ObjectId so this is impossible to use different services

* Fetch the first N comments for every post in the feed. In one request.

## Deprecation notices
* SequelizeMigrations has been deprecated. All new migrations should be created via knex
* Sequelize ORM is deprecated. Use knex instead.
* `post_stats` is deprecated. In the future, all stats should be placed in posts_current_params
