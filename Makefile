DOCKER_BACKEND_APP_USER=node
DOCKER_BACKEND_APP_NAME=backend

DOCKER_B_EXEC_CMD=docker-compose exec -T --user=${DOCKER_BACKEND_APP_USER} ${DOCKER_BACKEND_APP_NAME}
DOCKER_B_EXEC_CMD_ROOT=docker-compose exec -T --user=root ${DOCKER_BACKEND_APP_NAME}

SEQ_EXEC_FILE=node_modules/.bin/sequelize
KNEX_EXEC_FILE=node_modules/.bin/knex

DB_DROP_COMMAND=${SEQ_EXEC_FILE} db:drop
DB_CREATE_COMMAND=${SEQ_EXEC_FILE} db:create
DB_MIGRATE_COMMAND=${SEQ_EXEC_FILE} db:migrate
DB_SEEDS_UNDO_COMMAND=${SEQ_EXEC_FILE} db:undo:all
DB_GENERATE_MIGRATION=${KNEX_EXEC_FILE} migrate:make

DB_KNEX_MIGRATE_EVENTS_COMMAND=${KNEX_EXEC_FILE} migrate:latest --env=events
DB_KNEX_MIGRATE_MONOLITH_COMMAND=${KNEX_EXEC_FILE} migrate:latest --env=monolith

ENV_VALUE_TEST=test

init-project ip:
	make docker-rebuild
	npm ci
	make docker-init-test-db
	make docker-compile-typescript
	make pm2-reload-test-ecosystem
	make docker-pm2-list

docker-rebuild:
	docker-compose down --remove-orphans
	make docker-up-build-force

pm2-reload-test-ecosystem pmt:
	${DOCKER_B_EXEC_CMD} pm2 reload ecosystem-test.config.js --update-env

docker-npm-ci:
	${DOCKER_B_EXEC_CMD} npm ci

docker-prepare-for-tests pft:
	make init-project
	make docker-check-project

docker-check-project:
	make docker-compile-typescript
	make docker-check-by-eslint
	make docker-check-project-script

docker-compile-typescript:
	${DOCKER_B_EXEC_CMD} npm run compile-ts

docker-check-by-eslint:
	${DOCKER_B_EXEC_CMD} npm run check-by-eslint

docker-check-project-script:
	${DOCKER_B_EXEC_CMD} /bin/bash ./check-project.sh

docker-compile-typescript-watch:
	${DOCKER_B_EXEC_CMD} npm run compile-ts-watch

docker-chown:
	${DOCKER_B_EXEC_CMD_ROOT} chgrp -R docker: /var/www/ucom.backend

docker-db-migrate-sequelize dm:
	${DOCKER_B_EXEC_CMD} ${DB_MIGRATE_COMMAND}

docker-db-create-migration-monolith dmg:
	${DOCKER_B_EXEC_CMD} ${DB_GENERATE_MIGRATION} ${NAME} --env=monolith

docker-db-create-migration-events:
	${DOCKER_B_EXEC_CMD} ${DB_GENERATE_MIGRATION} ${NAME} --env=events

docker-up-build:
	docker-compose up -d --build

docker-run-all-tests:
	${DOCKER_B_EXEC_CMD} npm run test-all

docker-up-build-force df:
	docker-compose up -d --build --force-recreate

docker-db-test-bash d-db:
	docker-compose exec --user=root db_test /bin/bash

docker-backend-bash:
	docker-compose exec --user=${DOCKER_BACKEND_APP_USER} ${DOCKER_BACKEND_APP_NAME} /bin/bash

docker-backend-bash-root:
	docker-compose exec --user=root ${DOCKER_BACKEND_APP_NAME} /bin/bash

docker-pm2-list:
	${DOCKER_B_EXEC_CMD} pm2 list

deploy-staging deploy:
	git checkout staging
	make docker-check-project
	git push
	ssh gt 'bash -s' < ./uos_backend_deploy_staging.sh

deploy-production:
	git checkout master
	make docker-check-project
	git push
	ssh gt 'bash -s' < ./uos_backend_deploy_production.sh

deploy-frontend-staging deploy-frontend:
	ssh gt bash deploy_frontend_staging

deploy-frontend-production:
	ssh gt bash deploy_frontend_production

production-error-logs pl:
	ssh gt 'bash -s' < ./pm2_error_logs.sh production

staging-error-logs sl:
	ssh gt 'bash -s' < ./pm2_error_logs.sh staging

prod-console:
	ssh gt 'bash -s' < ./pm2_console_logs.sh production_app_backend

staging-console:
	ssh gt 'bash -s' < ./pm2_console_logs.sh staging_app_backend

ipfs-tunnel:
	ssh -f -L 5001:127.0.0.1:5001 ipfs -N

docker-recreate-db:
	${DOCKER_B_EXEC_CMD} ${DB_DROP_COMMAND}
	${DOCKER_B_EXEC_CMD} ${DB_CREATE_COMMAND}
	make docker-migrate-monolith-via-knex

docker-recreate-events-db:
	${DOCKER_B_EXEC_CMD} bin/test-only-scripts/knex-create-new-db
	make docker-migrate-events-via-knex

docker-recreate-monolith-db:
	${DOCKER_B_EXEC_CMD} ${DB_DROP_COMMAND}
	${DOCKER_B_EXEC_CMD} ${DB_CREATE_COMMAND}
	make docker-db-migrate-sequelize
	make docker-migrate-monolith-via-knex

docker-migrate-monolith-via-knex:
	${DOCKER_B_EXEC_CMD} ${DB_KNEX_MIGRATE_MONOLITH_COMMAND}

docker-migrate-events-via-knex:
	${DOCKER_B_EXEC_CMD} ${DB_KNEX_MIGRATE_EVENTS_COMMAND}

docker-init-test-db ditd:
	make docker-recreate-monolith-db
	make docker-recreate-events-db

copy-production-config:
	scp ./config/production.json gt:/var/www/ucom.backend/config/production.json

copy-staging-config:
	scp ./config/staging.json gt:/var/www/ucom.backend.staging/config/staging.json