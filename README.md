# U°Community Backend API Service

[![Known Vulnerabilities](https://snyk.io/test/github/vladimirice/ucom.backend/badge.svg)](https://snyk.io/test/github/vladimirice/ucom.backend)

## Main features
* Social network - Users, Posts, Comments etc.
* All social actions are written to the blockchain
* User's rating = blockchain rating.
* UOS/EOS blockchain integration
* 600+ autotests
* High-load architecture - queue servers, background tasks, database sharding

## Content
* [Main goals](#main-goals)
* [Installation](documentation/INSTALLATION.md)
* [How-to](documentation/HOW_TO.md)
* [Architecture](documentation/ARCHITECTURE.md)
* [Entities](documentation/ENTITIES.md) - a list of all project entities (Users, Posts, etc.)
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

## Main goals

* User authentication (via JWT tokens, stateless).
* Business logic validation before sending transactions to blockchain.
* Content storage. In future all content will be stored inside IPFS
* Blockchain information caching - for example, transactions and block producers explorer.


See [CONTRIBUTING](../../../uos.docs/blob/master/CONTRIBUTING.md) for U°Community projects information.
