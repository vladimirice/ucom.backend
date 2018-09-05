SEQ_EXEC_FILE=node_modules/.bin/sequelize

DB_DROP_COMMAND=${SEQ_EXEC_FILE} db:drop
DB_CREATE_COMMAND=${SEQ_EXEC_FILE} db:create
DB_MIGRATE_COMMAND=${SEQ_EXEC_FILE} db:migrate
DB_SEEDS_COMMAND=${SEQ_EXEC_FILE} db:seed:all
DB_SEEDS_UNDO_COMMAND=${SEQ_EXEC_FILE} db:undo:all

ENV_VALUE_TEST=test
ENV_VALUE_DEV=development

d-up:
	docker-compose up -d --build

d-up-f:
	docker-compose up -d --build --force-recreate

d-stop:
	docker-compose stop
d-down:
	docker-compose down

docker-set-hosts-mac:
	sudo /bin/bash ./etc/docker/etchosts.sh update uos-backend-postgres.dev 127.0.0.1     /private/etc/hosts
	sudo /bin/bash ./etc/docker/etchosts.sh update uos-backend-postgres-test.dev 127.0.0.1     /private/etc/hosts

d-db:
	docker-compose exec --user=root db /bin/bash

dmm:
	NODE_ENV=${ENV_VALUE_DEV} ${DB_MIGRATE_COMMAND}
	make ditd

deploy:
	ssh dev@5.9.119.5 'bash -s' < ./uos_backend_deploy.sh

docker-init-test-db ditd:
	NODE_ENV=${ENV_VALUE_TEST} ${DB_DROP_COMMAND}
	NODE_ENV=${ENV_VALUE_TEST} ${DB_CREATE_COMMAND}
	NODE_ENV=${ENV_VALUE_TEST} ${DB_MIGRATE_COMMAND}
	NODE_ENV=${ENV_VALUE_TEST} ${DB_SEEDS_COMMAND}

docker-init-dev-db didd:
	NODE_ENV=${ENV_VALUE_DEV} ${DB_DROP_COMMAND}
	NODE_ENV=${ENV_VALUE_DEV} ${DB_CREATE_COMMAND}
	NODE_ENV=${ENV_VALUE_DEV} ${DB_MIGRATE_COMMAND}
	NODE_ENV=${ENV_VALUE_DEV} ${DB_SEEDS_COMMAND}
