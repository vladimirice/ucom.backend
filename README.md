# U°Community Backend API Service

## Most interesting features
* Social network - Users, Posts, Comments etc.
* All social actions are written to the blockchain
* User's rating are calculated by blockchain.
* UOS/EOS blockchain integration.

## Most interesting technical solutions
* Background queues - RabbitMQ.
* All social network events are saved as quick as possible to process later by queue consumers.
* Database sharding - separate analytics database.
* GraphQL API
* 600+ autotests, test-driven-development (TDD)

## Most interesting descriptions - have a look
**Architecture**:
* [UOS data flow](documentation/architecture/UOS_DATA_FLOW.md)
* [UOS test components](documentation/architecture/UOS_TESTS_COMPONENTS.md)

**Code**:
* [Referral program](documentation/features/REFERRAL_PROGRAM.md)
* [Blockchain explorer](documentation/features/BLOCKCHAIN_EXPLORER.md)
* [Airdrop payments processing](documentation/features/AIRDROP_PAYMENTS_PROCESSING.md)

![UOS data flow](https://raw.githubusercontent.com/UOSnetwork/ucom.backend/master/documentation/jpg/uos-data-flow.jpg)

![UOS libraries](https://raw.githubusercontent.com/UOSnetwork/ucom.backend/master/documentation/jpg/uos-libraries.jpg)

![UOS test components](https://raw.githubusercontent.com/UOSnetwork/ucom.backend/master/documentation/jpg/uos-test-components.jpg)

![Current infrastructure](https://raw.githubusercontent.com/UOSnetwork/ucom.backend/master/documentation/jpg/production-infrastructure.jpg)

![Social action workflow](https://raw.githubusercontent.com/UOSnetwork/ucom.backend/master/documentation/jpg/social-action-workflow.jpg)

## Table of contents
* [Architecture](documentation/architecture)
    * [Overview](documentation/architecture/ARCHITECTURE_OVERVIEW.md)
    * [UOS data flow](documentation/architecture/UOS_DATA_FLOW.md)
    * [Services and applications](documentation/architecture/SERVICES_AND_APPLICATIONS.md)
    * [UOS tests components](documentation/architecture/UOS_TESTS_COMPONENTS.md)
    * [Social action to the blockchain](documentation/architecture/SOCIAL_ACTION_TO_THE_BLOCKCHAIN.md)
    * [Entities](documentation/architecture/ENTITIES.md)
* [Features](documentation/features)
    * [Referral program](documentation/features/REFERRAL_PROGRAM.md)
    * [Airdrop and balances](documentation/features/AIRDROP_PAYMENTS_PROCESSING.md)
    * [Analytics module](documentation/features/ANALYTICS_MODULE.md)
    * [Blockchain explorer](documentation/features/BLOCKCHAIN_EXPLORER.md)
    * [Entity images](documentation/features/ENTITY_IMAGES.md)
    * [Images uploader](documentation/features/IMAGES_UPLOADER.md)
    * [Posts features list](documentation/features/POSTS_FEATURES.md)
* Features - code only, no description yet
    * [Users](lib/users)
    * [Posts](lib/posts)
    * [Comments](lib/comments)
    * [Communities](lib/organizations)
    * [Content tags](lib/tags)
    * [Content mentions](lib/mentions)
    * [Votes/Following/Trust/other activities](lib/users/activity)
    * [GitHub integration](lib/github)
    * [Rate limiters (REDIS lock)](lib/common/client/redis-client.ts)
    * [Websocket](lib/websockets)
    * [GraphQL](lib/graphql)
* [Infrastructure](documentation/infrastructure)
    * [Overview](documentation/infrastructure/INFRASTRUCTURE_OVERVIEW.md)
    * [Maintenance](documentation/infrastructure/MAINTENANCE.md)
* [How-to](documentation/how-to)
    * [Installation](documentation/how-to/INSTALLATION.md)
    * [Step-by-step coding](documentation/how-to/STEP_BY_STEP_FOR_CODING.md)
    * [Problems and solutions](documentation/how-to/PROBLEMS_AND_SOLUTIONS.md)
    * [Style guide](documentation/how-to/STYLE_GUIDE.md)
    * [Technical debt](documentation/how-to/TECHNICAL_DEBT.md)

See [CONTRIBUTING](https://github.com/UOSnetwork/uos.docs/blob/master/CONTRIBUTING.md) for U°Community projects information.
