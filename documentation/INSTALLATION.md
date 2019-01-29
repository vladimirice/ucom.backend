# Installation

All project components, except UOS blockchain, are inside docker. So it is required to configure blockchain data
manually.

## Blockchain-related configuration.

You have to create by yourself:
* blockchain account which is used to to register other accounts by backend application
* four test accounts in order to run all transaction related autotests.
* five block producers in order to run all transaction related autotests

After it you should send at least 1000 UOS tokens to every test account and even more for account-registrar
in order to pass autotests successfully and so be able to use all backend functions. 

Then create a file `/config/accounts-data.js` and inside it write down all required data. You can refer a sample file
`/config/account-data-sample.js`

You should preserve `accounts-data.js` object keys (`vlad`, `jane` etc.), but object values `account_name` might have
any value you provide.

Then create a file `/config/test.json` and provide blockchain mongodb-plugin related configuration. You can refer
a sample file `/config/test-sample.json`

## Docker part (linux only)

Install `docker` and `docker-compose`. Then create symlink in project root directory:
```
ln -s etc/docker/docker-compose-linux.yml ./docker-compose.yml
```

Then run:

```
   make init-project
```

After it in order to run tests use this command:

```
    make docker-run-all-tests
```
