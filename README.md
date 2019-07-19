# U°Community Backend API Service

[![Known Vulnerabilities](https://snyk.io/test/github/vladimirice/ucom.backend/badge.svg)](https://snyk.io/test/github/vladimirice/ucom.backend)

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

## Most interesting code guide
* [blockchain explorer](documentation/code-guide/BLOCKCHAIN_EXPLORER.md)
* airdrop payment system - SOON!
* affiliate network      - SOON!
* stats module           - SOON!

![Social action workflow](https://raw.githubusercontent.com/UOSnetwork/ucom.backend/master/documentation/jpg/social-action-workflow.jpg)

![Current infrastructure](https://raw.githubusercontent.com/UOSnetwork/ucom.backend/master/documentation/jpg/production-infrastructure.jpg)

## Table of contents
* [Installation](documentation/INSTALLATION.md)
* [How-to](documentation/HOW_TO.md)
* [Architecture](documentation/ARCHITECTURE.md)
* [Entities](documentation/ENTITIES.md)
* [Features](documentation/features)
    * [Current workflow](documentation/features/CURRENT_WORKFLOW.md)
    * [Services and applications](documentation/features/SERVICES_AND_APPLICATIONS.md)
    * [Affiliate programs](documentation/features/AFFILIATE_PROGRAMS.md)
    * [Entity images](documentation/features/ENTITY_IMAGES.md)
* [Infrastructure](documentation/INFRASTRUCTURE.md)
* [Improvements and scaling strategies](documentation/IMPROVEMENTS_AND_SCALING_STRATEGIES.md)
* [Style guide](documentation/STYLE_GUIDE.md)
* [Technical debt](documentation/TECHNICAL_DEBT.md)
* [Problems and solutions](documentation/PROBLEMS_AND_SOLUTIONS.md)
* [For reference](documentation/FOR_REFERENCE.md)



See [CONTRIBUTING](../../../uos.docs/blob/master/CONTRIBUTING.md) for U°Community projects information.
