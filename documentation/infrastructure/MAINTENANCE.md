# Maintenance

## How to clean the database

Run for the staging database (lasts at least 10 minutes). And use a date which is the current date minus 1 month
```
DELETE FROM entity_event_param WHERE created_at <= '2019-10-10';
```

Then, run:
```
    VACUUM FULL entity_event_param
```


## How to reload/restart all processes on production

```
    /var/www/ucom.backend/ci-scripts/deploy/pm2-reload-ecosystem-remote.sh production 1 1 1
```

[script itself](../../ci-scripts/deploy/pm2-reload-ecosystem-remote.sh)
