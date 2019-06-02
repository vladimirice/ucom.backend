# Affiliate programs

[JPEG Schema](../jpg/referral-program-workflow.jpg)

A referral program is a kind of affiliate programs.


## Related services


Name | Description
--- | ---
app-redirect | A separate application which provides affiliate program `click` conversion


## A referral link

A referral link structure:
https://hello.u.community/{referral_program_id}/{referrer_identity}/?{utm_labels_query_string}

example:
https://hello.u.community/Hv1a/spirinspirin/?utm_source=fb&utm_content=small&sub1=supersub1&sub2=supersub2

----------------------------------------------

## A frontend part of the registration

Step 1 - fetch a `referral program state`

libs to import:
const { EventsIds } = require('ucom.libs.common').Events.Dictionary;
const {  Interactions } = require('ucom-libs-wallet').Dictionary;


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

Case 2 - there is no any cookie (a regular registration)
Status code is 422 (Unprocessable Entity)

Response body is empty

Case 3 - errors. A regular errors format. Status code is 4**

----

Step 2 - registration request

Case 1 - status code for `referral-programs` was 200

* Call the SocialApi.getReferralFromUserSignedTransactionAsJson. Use a provided `account_name_source`

append an additional field to the registration request
```
{
    // ... the regular fields like account_name, sign, etc....
    affiliates_actions: [
        {
            offer_id: 5,
            account_name_source: 'spirinspirin',    // to pass to the SocialApi.getReferralFromUserSignedTransactionAsJson wallet function
            action: Interactions.referral(),        // what function to call - SocialApi.getReferralFromUserSignedTransactionAsJson
            signed_transaction: '{.....}',          // a result of the call of SocialApi.getReferralFromUserSignedTransactionAsJson
        }
    ],
}
```

Note: do not sign it beforehand. Sign it right before sending a request. Because there is a signed transaction expiration time

Case 2 - status was 'Unprocessable entity' (422)
Do not add an additional field, do not sign a transactions
