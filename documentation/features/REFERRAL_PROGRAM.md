# Referral program

Goal: a bonus (extra tokens emission) for the already registered user who brought the new user (bonus for the registration).

TODO - change the image
![Affiliate program workflow](https://raw.githubusercontent.com/UOSnetwork/ucom.backend/master/documentation/jpg/referral-program-workflow.jpg)

A description with code links:
TODO

A description of integration tests:
TODO

Affiliates module
* Models by an example - affiliates
* Code organization - router, service, repository, etc.
    * test/helpers/affiliates/affiliates-before-all-helper.ts
    * test/integration/affiliates/affiliates-redirect.test.ts
    * Add common checker link
* Life example of test framework code - affiliates ecosystem



To check is user a referral:
lib/affiliates/service/conversions/attribution-service.ts

To process referral action:
lib/affiliates/service/conversions/registration-conversion-service.ts

