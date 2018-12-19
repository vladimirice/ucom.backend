SEQ_EXEC_FILE=node_modules/.bin/sequelize

DB_DROP_COMMAND=${SEQ_EXEC_FILE} db:drop
DB_CREATE_COMMAND=${SEQ_EXEC_FILE} db:create
DB_MIGRATE_COMMAND=${SEQ_EXEC_FILE} db:migrate
DB_SEEDS_UNDO_COMMAND=${SEQ_EXEC_FILE} db:undo:all

ENV_VALUE_TEST=test

init-project ip:
	docker-compose down
	docker-compose up -d --build --force-recreate

pm2-reload-test-ecosystem pmt:
	docker-compose exec -T --user=root backend pm2 reload ecosystem-test.config.js --update-env

docker-db-migrate dm:
	docker-compose exec -T --user=root backend ${DB_MIGRATE_COMMAND}

docker-up-build:
	docker-compose up -d --build

docker-up-build-force df:
	docker-compose up -d --build --force-recreate

docker-db-shell d-db:
	docker-compose exec --user=root db /bin/bash

docker-backend-shell d-back:
	docker-compose exec --user=root backend /bin/bash

deploy-staging deploy:
	git checkout staging
	git push
	ssh gt 'bash -s' < ./uos_backend_deploy_staging.sh

deploy-production:
	git checkout master
	git push
	ssh gt 'bash -s' < ./uos_backend_deploy_production.sh

deploy-frontend-staging deploy-frontend:
	ssh gt bash deploy_frontend_staging

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

docker-init-test-db ditd:
	docker-compose exec -T --user=root backend ${DB_DROP_COMMAND}
	docker-compose exec -T --user=root backend ${DB_CREATE_COMMAND}
	docker-compose exec -T --user=root backend ${DB_MIGRATE_COMMAND}