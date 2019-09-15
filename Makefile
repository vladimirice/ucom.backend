DOCKER_BACKEND_APP_USER=node
DOCKER_BACKEND_APP_NAME=backend

DOCKER_DB_EXEC_CMD=docker-compose exec -T --user=root db_test

DOCKER_B_EXEC_CMD=docker-compose exec -T --user=${DOCKER_BACKEND_APP_USER} ${DOCKER_BACKEND_APP_NAME}
DOCKER_B_EXEC_CMD_ROOT=docker-compose exec -T --user=root ${DOCKER_BACKEND_APP_NAME}

KNEX_EXEC_FILE=node_modules/.bin/knex

DB_GENERATE_MIGRATION=${KNEX_EXEC_FILE} migrate:make

DB_KNEX_MIGRATE_EVENTS_COMMAND=${KNEX_EXEC_FILE} migrate:latest --env=events
DB_KNEX_MIGRATE_MONOLITH_COMMAND=${KNEX_EXEC_FILE} migrate:latest --env=monolith

ENV_VALUE_TEST=test

UPDATE_HOSTS_COMMAND=sudo /bin/bash ./etc/docker/etchosts.sh update
LINUX_HOSTS_FILENAME=/etc/hosts

init-project ip:
	make docker-rebuild
	npm ci
	make docker-init-test-db
	make docker-compile-typescript
	make pm2-reload-ecosystem-test
	make docker-pm2-list

docker-rebuild:
	docker-compose down --remove-orphans
	make docker-up-build-force

docker-init-db-by-sql dis:
	${DOCKER_DB_EXEC_CMD} psql -U uos postgres -c 'DROP DATABASE IF EXISTS uos_backend_app'
	${DOCKER_DB_EXEC_CMD} psql -U uos postgres -c 'DROP DATABASE IF EXISTS uos_backend_events'
	${DOCKER_DB_EXEC_CMD} psql -U uos postgres -c 'CREATE DATABASE uos_backend_app'
	${DOCKER_DB_EXEC_CMD} psql -U uos postgres -c 'CREATE DATABASE uos_backend_events'
	docker cp ./migrations/sequelize-migrations-final-dump.sql ucom_backend_db_test:/
	${DOCKER_DB_EXEC_CMD} psql -U uos uos_backend_app -f sequelize-migrations-final-dump.sql

pm2-reload-ecosystem-test pmt:
	${DOCKER_B_EXEC_CMD} pm2 reload ecosystem-test.config.js --update-env

pm2-reload-ecosystem-staging:
	ssh gt 'bash -s' < ./ci-scripts/deploy/pm2-reload-ecosystem-remote.sh staging 1 1

pm2-reload-ecosystem-production:
	ssh gt 'bash -s' < ./ci-scripts/deploy/pm2-reload-ecosystem-remote.sh production 1 1

pm2-reload-ecosystem-iframely:
	ssh gt 'bash -s' < ./ci-scripts/deploy/pm2-reload-ecosystem-remote.sh production 0 0 1

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

docker-db-bash d-db:
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

deploy-staging-no-check deploy-no-check:
	git checkout staging
	git push
	ssh gt 'bash -s' < ./uos_backend_deploy_staging.sh

deploy-production-snyk:
	git checkout master
	snyk test
	make deploy-production

deploy-production:
	git checkout master
	make docker-check-project
	git push
	ssh gt 'bash -s' < ./uos_backend_deploy_production.sh

prepare-deploy-production:
	git checkout master
	make docker-check-project
	git push

run-deploy-production-script:
	ssh gt 'bash -s' < ./uos_backend_deploy_production.sh

deploy-frontend-staging deploy-frontend:
	ssh gt bash /var/www/ucom.frontend/deploy_frontend_staging

deploy-frontend-production:
	ssh gt bash /var/www/ucom.frontend/deploy_frontend_production

production-error-logs pl:
	ssh gt 'bash -s' < ./pm2_error_logs.sh production

staging-error-logs sl:
	ssh gt 'bash -s' < ./pm2_error_logs.sh staging

prod-console:
	ssh gt 'bash -s' < ./pm2_console_logs.sh production_app_backend

worker-console-blockchain-nodes-production-console:
	ssh gt 'bash -s' < ./pm2_console_logs.sh production-worker-update-blockchain-nodes

worker-console-uos-accounts-properties-update-production-console:
	ssh gt 'bash -s' < ./pm2_console_logs.sh production-uos-accounts-properties-update-worker

staging-console:
	ssh gt 'bash -s' < ./pm2_console_logs.sh staging_app_backend

ipfs-tunnel:
	ssh -f -L 5001:127.0.0.1:5001 ipfs -N

docker-migrate-monolith-via-knex dmm:
	${DOCKER_B_EXEC_CMD} ${DB_KNEX_MIGRATE_MONOLITH_COMMAND}

docker-migrate-events-via-knex:
	${DOCKER_B_EXEC_CMD} ${DB_KNEX_MIGRATE_EVENTS_COMMAND}

docker-init-test-db ditd:
	make docker-init-db-by-sql
	make docker-migrate-monolith-via-knex
	make docker-migrate-events-via-knex

production-config-from-server-to-local:
	scp gt:/var/www/ucom.backend/config/production.json ./config/production.json

deploy-local-config-to-production:
	scp ./config/production.json gt:/var/www/ucom.backend/config/production.json

staging-config-from-server-to-local:
	scp gt:/var/www/ucom.backend.staging/config/staging.json ./config/staging.json

deploy-local-config-to-staging:
	scp ./config/staging.json gt:/var/www/ucom.backend.staging/config/staging.json

docker-set-hosts-linux:
	${UPDATE_HOSTS_COMMAND} uos-backend-postgres-test.dev   173.18.212.11 ${LINUX_HOSTS_FILENAME}
	${UPDATE_HOSTS_COMMAND} uos-backend-rabbitmq.dev        173.18.212.20 ${LINUX_HOSTS_FILENAME}
	${UPDATE_HOSTS_COMMAND} uos-backend-redis.dev           173.18.212.30 ${LINUX_HOSTS_FILENAME}
	${UPDATE_HOSTS_COMMAND} irreversible-traces-mongodb.dev 173.18.212.50 ${LINUX_HOSTS_FILENAME}
