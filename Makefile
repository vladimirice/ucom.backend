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

init-project ip:
	docker-compose up -d --build
	make ditd
	make pmt

pmt:
	PM2_USER_PARAM_RESTART=true pm2 reload ecosystem-test.config.js --update-env

pmrt:
	pm2 restart ecosystem-test.config.js

pm2-l-nc:
	pm2 logs test_uos_backend_notifications_consumer

pm2-l-bc:
	pm2 logs test_uos_backend_blockchain_consumer

d-up-f:
	docker-compose up -d --build --force-recreate

d-stop:
	docker-compose stop
d-down:
	docker-compose down

docker-set-hosts-mac:
	sudo /bin/bash ./etc/docker/etchosts.sh update uos-backend-postgres.dev 127.0.0.1     /private/etc/hosts
	sudo /bin/bash ./etc/docker/etchosts.sh update uos-backend-postgres-test.dev 127.0.0.1     /private/etc/hosts
	sudo /bin/bash ./etc/docker/etchosts.sh update uos-backend-rabbitmq.dev 127.0.0.1     /private/etc/hosts

d-db:
	docker-compose exec --user=root db /bin/bash

deploy-production:
	git push
	ssh dev@5.9.119.5 'bash -s' < ./uos_backend_deploy_production.sh

deploy-frontend:
	ssh dev@5.9.119.5 bash deploy_frontend

deploy:
	git checkout staging
	git push
	ssh dev@5.9.119.5 'bash -s' < ./uos_backend_deploy_staging.sh

production-logs pl:
	ssh dev@5.9.119.5 'bash -s' < ./pm2_error_logs.sh production

staging-logs sl:
	ssh dev@5.9.119.5 'bash -s' < ./pm2_error_logs.sh staging

prod-console:
	ssh dev@5.9.119.5 'bash -s' < ./pm2_console_logs.sh production_backend

ipfs-tunnel:
	ssh -f -L 5001:127.0.0.1:5001 ipfs -N

local-logs:
	tail -f logs/app.log

database-migrations-migrate dmm:
	node_modules/.bin/sequelize db:migrate

docker-init-test-db ditd:
	NODE_ENV=${ENV_VALUE_TEST} ${DB_DROP_COMMAND}
	NODE_ENV=${ENV_VALUE_TEST} ${DB_CREATE_COMMAND}
	NODE_ENV=${ENV_VALUE_TEST} ${DB_MIGRATE_COMMAND}
	NODE_ENV=${ENV_VALUE_TEST} ${DB_SEEDS_COMMAND}