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