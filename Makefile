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
	sudo /bin/bash ./etc/docker/etchosts.sh update uos-backend-rabbitmq.dev 127.0.0.1     /private/etc/hosts

d-db:
	docker-compose exec --user=root db /bin/bash

dmm:
	NODE_ENV=${ENV_VALUE_DEV} ${DB_MIGRATE_COMMAND}
	make ditd

deploy d:
	git push
	ssh dev@5.9.119.5 'bash -s' < ./uos_backend_deploy.sh

pm2-prod-logs ppl:
	ssh dev@5.9.119.5 'bash -s' < ./pm2_production_logs.sh

ipfs-tunnel:
	ssh -f -L 5001:127.0.0.1:5001 ipfs -N

local-logs:
	tail -f logs/app.log

stop-all-c:
	pm2 stop uos_backend_blockchain_consumer
	pm2 stop uos_backend_ipfs_consumer

restart-blockchain-consumer rbc:
	pm2 restart ecosystem.config.js --env test --only uos_backend_blockchain_consumer

restart-all-consumers rac:
	pm2 restart ecosystem.config.js --env test --only uos_backend_blockchain_consumer
	pm2 restart ecosystem.config.js --env test --only uos_backend_ipfs_consumer

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
