# ARCHITECTURE OVERVIEW

Table of contents:
* [Libraries](#libraries)
* [List of main technologies](#list-of-main-technologies)
* [UOS data flow](./UOS_DATA_FLOW.md)
* [Services and applications](./SERVICES_AND_APPLICATIONS.md)
* [UOS tests components](./UOS_TESTS_COMPONENTS.md)
* [Social action to the blockchain](./SOCIAL_ACTION_TO_THE_BLOCKCHAIN.md)
* [Entities](./ENTITIES.md)

## Libraries

![UOS libraries](https://raw.githubusercontent.com/UOSnetwork/ucom.backend/master/documentation/jpg/uos-libraries.jpg)

Library | Description
--- | ---
[ucom.libs.wallet](https://github.com/UOSnetwork/ucom.libs.wallet) | All blockchain-related business logic must be placed to this library.
[ucom.libs.common](https://github.com/UOSnetwork/ucom.libs.common) | Methods, dictionaries, etc. that are used both by frontend and backend applications.
[ucom.libs.social.transactions](https://github.com/UOSnetwork/ucom.libs.social.transactions) | Deprecated library which contains methods to create social transactions.
[ucom.libs.graphql-schemas](https://github.com/UOSnetwork/ucom.libs.graphql-schemas) | A library of methods to make GraphQL requests.

## List of main technologies
* NodeJs
* GraphQL
* REST
* PostgreSQL
* REDIS
* RabbitMQ
