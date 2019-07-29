# Referral program

Goal: a bonus (extra tokens emission) for the already registered user who brought the new user (bonus for the registration).

`Affiliates` - is a common word for affiliate partnership marketing modules. `Referral program` is a kind of affiliate
partnership. 

![Referral program](https://raw.githubusercontent.com/UOSnetwork/ucom.backend/master/documentation/jpg/referral-program.jpg)

## Directory structure:

**Note:** the backend application has a `domain-driven-design (DDD)`  directory structure. Thus, referral program `domain`
is placed in the dedicated [directory](../../lib/affiliates) 

Directory | What is inside
--- | ---
[applications](../../lib/affiliates/applications) | redirect server (expressJS) - use to run and for autotests
[bin](../../lib/affiliates/bin)  | script to run a redirect server
[dictionary](../../lib/affiliates/dictionary) | related dictionaries
[errors](../../lib/affiliates/errors) | custom errors
[interfaces](../../lib/affiliates/interfaces) | Typescript interfaces
[models](../../lib/affiliates/models) | ObjectionJS object-relational-mapping (ORM) models
[repository](../../lib/affiliates/repository) | a collection of classes with methods to access models
[router](../../lib/affiliates/router) | server routes
[service](../../lib/affiliates/service) | a collection of services, business layer
[validators](../../lib/affiliates/validators) | validate incoming requests
[workers](../../lib/affiliates/workers) | background CRON workers 
            
## Autotests

Directories are listed below.

Directory | What is inside
--- | --- 
[Generators](../../test/generators/affiliates) | Generators to seed database
[Helpers](../../test/helpers/affiliates) | Classes which includes reusable referral program tests logic
[Autotests](../../test/integration/affiliates) | Autotests

Main component classes are listed below.

Component name | Component type | Description
--- | --- | --- 
[Prepare ecosystem](../../test/helpers/affiliates/affiliates-before-all-helper.ts) | Before all | Before all methods used from `Jest`
[Program generator](../../test/generators/affiliates/affiliates-generator.ts) | Generator | Create a referral program post 
- | - | -
[Redirect request maker](../../test/helpers/affiliates/redirect-request.ts) | Request maker | Autotests helper class to make redirect requests 
[Redirect response checker](../../test/helpers/affiliates/redirect-checker.ts) | Response checker | Autotests helper class to check redirect response 
- | - | -
[Referral program request maker](../../test/helpers/affiliates/affiliates-request.ts) | Request maker | Autotests helper class to make referral request 
[Referral program response checker](../../test/helpers/affiliates/affiliates-checker.ts) | Response checker | Autotests helper class to check referral response 

