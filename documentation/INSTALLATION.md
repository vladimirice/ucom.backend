# Installation

All project components, except UOS blockchain, are inside docker. So it is required to configure blockchain data
manually.

## Blockchain-related configuration.

You have to create by yourself:
* a blockchain account which is used to register other accounts by the backend application
* four test accounts in order to run all transaction related autotests
* five block producers in order to run all the transaction related autotests

After doing this, you should send at least 1000 UOS tokens to every test account and 1000+ UOS tokens for the account-registrar
in order to pass the autotests successfully and so that you are able to use all the backend functions. 

Then create a file `/config/accounts-data.js` and inside it write down all the required data. You can refer to the sample file
`/config/account-data-sample.js`

You should preserve the `accounts-data.js` object keys (`vlad`, `jane` etc.), but the object values `account_name` may have
any value you provide.

Then create a file `/config/test.json` and provide the blockchain mongodb-plugin related configuration. You can refer to
the sample file `/config/test-sample.json`

## Docker part (linux only)

Install `docker` and `docker-compose`. Then create a symlink in the project root directory:
```
ln -s etc/docker/docker-compose-linux.yml ./docker-compose.yml
```

Then run:

```
   make init-project
```

After running thus, in order to run tests, use this command:

```
    make docker-run-all-tests
```
