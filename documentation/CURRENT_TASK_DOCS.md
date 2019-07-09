# Current task docs


This file is for frontend team only

## Save profile to blockchain

### After the registration

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

### During a regular profile updating

Attach one more field like for follow
```
signed_transaction: '{.....}',          // a result of the call of ContentApi.updateProfile
```


## Users list

[Fetch using different filters](../test/integration/users/get/users-get-graphql.test.ts)




