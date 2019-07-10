# Current task docs

This file is for frontend team only

## Save profile to blockchain

```
const { ContentApi } = require('ucom-libs-wallet');
```

### After the registration before the redirect (like for referrals)

Request URL
```
POST /transactions/registration-profile
Headers: Auth token
```

Request body:
```
signed_transaction: '{.....}',          // a result of the call of ContentApi.createProfileAfterRegistration
user_created_at: moment().utc().format(),
```

Notes:
* If error is occurred - log it and redirect user. Do not break the registration flow.

### During a regular profile updating

Attach one more field with the transaction
```
signed_transaction: '{.....}',          // a result of the call of ContentApi.updateProfile
```

Notes:
* provide a full JSON, composed from user profile.
* Process errors as regular - break a cycle if there are any errors.

## Users list

[Fetch using different filters](../test/integration/users/get/users-get-graphql.test.ts)
