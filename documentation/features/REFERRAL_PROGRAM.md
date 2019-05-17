Final tasks:
* recheck all business cases
* recheck frontend interfaces

Support, monday
* Change mini-mongo port for wallet lib
* Change mini-mongo port for social transactions legacy lib

# Referral program

referral_program_uri

A referral link structure:
https://hello.u.community/{referral_program_id}/{referrer_identity}/?{utm_labels_query_string}

example:
https://hello.u.community/Hv1a/spirinspirin/?utm_source=fb&utm_content=small&sub1=supersub1&sub2=supersub2

----------------------------------------------

A frontend part of the registration

Step 1 - fetch a `referral program state`

* Before the registration :
POST /api/v1/myself/referral-program
body {
    event_id: 'registration',
}

Case 1 - there is a cookie
Response:
{
    program_id: 3, // always a constant, just for reference
    active: true, // is a referral program active in general
    account_name_source: 'spirinspirin', // to pass to the SocialApi.getReferralFromUserSignedTransactionAsJson wallet function
    active_for_myself: true, // only sign a transaction if true
}

Case 2 - there is no any cookie (a regular registration)
Response:
{
    program_id: 3,
    active: true,
    active_for_myself: false, // this is the main indicator
}

Case 3 - errors
{
    errors: [
        {
            message: 'cookie is not valid',
        },
        {
            message: "there is no any programs with event_id = 'rEgisTrati0n'",
        },
    ],
}


Step 2 - registration request

Case 1 - active_for_myself = true

* Call the SocialApi.getReferralFromUserSignedTransactionAsJson. Use a provided `account_name_source`

append an additional field to the registration request
{
    // ... the regular fields like account_name, sign, etc....
    referral_signed_json:  '{.....}', // a result of the call of SocialApi.getReferralFromUserSignedTransactionAsJson
    account_name_source: 'spirinspirin', // fetch it from the step 1
}

Note: do not sign it beforehand. Sign it right before sending a request. Because there is a signed transaction expiration time

Case 2 - active_for_myself = false
Do not add an additional field

Case 3 - errors. Cookie exists but no signed_referral_json in the request
* Backend server write an error log
* Registration is passed
* Resolve it manually. It is a development bug.

