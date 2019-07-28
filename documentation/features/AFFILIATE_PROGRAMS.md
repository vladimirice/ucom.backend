# Affiliate programs

![Affiliate program workflow](https://raw.githubusercontent.com/UOSnetwork/ucom.backend/master/documentation/jpg/referral-program-workflow.jpg)

A referral program is a kind of affiliate programs.

## Related services

Name | Description
--- | ---
app-redirect | A separate application which provides affiliate program `click` conversion


## A referral link

A referral link structure:
https://hello.u.community/{referral_program_id}/{referrer_identity}/?{utm_labels_query_string}

An example of staging:
https://staging-hello.u.community/jR/omgomgomgomg

----------------------------------------------

## A frontend part of the registration
libs to import:
```
const { EventsIds }     = require('ucom.libs.common').Events.Dictionary;
const { Interactions }  = require('ucom-libs-wallet').Dictionary;
const { SocialApi }     = require('ucom-libs-wallet');
```

Step 1 - fetch a `referral program state.`

* Before the registration:
POST /api/v1/affiliates/actions
```
body {
    event_id: EventsIds.registration(),
};
```

Case 1 - there is a cookie
Status code is: 200
Response:
```
{
    affiliates_actions: [
        {
            offer_id: 5,
            account_name_source: 'spirinspirin',    // to pass to the SocialApi.getReferralFromUserSignedTransactionAsJson wallet function
            action: Interactions.referral(),        // what function to call - SocialApi.getReferralFromUserSignedTransactionAsJson
        }
    ],
}
```

Case 2 - there is no cookie (a regular registration)
Status code is 422 (Unprocessable Entity)

The response body is empty.

Case 3 - errors. A regular errors format. Status code is 4**

--------------

Step 2 - a registration request

1. Make a regular registration request.
2. Make a referral-transaction request if required (status code for `referral-programs` was 200).

POST /api/v1/affiliates/referral-transaction

Request body
```
{
    signed_transaction: '{.....}',          // a result of the call of SocialApi.getReferralFromUserSignedTransactionAsJson
    account_name_source: 'spirinspirin',    // a parameter passed to SocialApi.getReferralFromUserSignedTransactionAsJson
    
    offer_id: 5,                            // provided by /api/v1/affiliates/actions response
    action: 'referral'                      // provided by /api/v1/affiliates/actions response
}
```

Response body
```
{
    success: true,
}
```

## A frontend part of referral info

* GraphQL library method - `getOneUserReferralsQueryPart`. An interface - as for the Trust feature.

* how to fetch user referral URL?
`myself.affiliates.referral_redirect_url`

how to fetch a referrer (source_user)?
`myself.affiliates.source_user`
