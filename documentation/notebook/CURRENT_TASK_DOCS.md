# Current task docs

This file is for frontend team only

## Content to the blockchain

[Examples](../../test/integration/posts/media-posts/posts-media-create-update-transactions.test.ts)


Notes:
* entity_tags -> extract them by yourself
    * if there are no entity_tags - provide an empty array
* Modify a post creation/updating request
    * add blockchain ID
    * add signed_transaction
* For post updating - a full set of updated fields must be provided as transaction content attribute. Not only
changed fields.
* Only for media posts (publications). Do not send transactions for direct posts, reposts, comments, etc.


## Entities search filter

[Example](../../test/integration/helpers/graphql-helper.ts)

Notes:
* there is no scaled_importance for communities and tags. Use order_by=-current_rate for them. For users use
order_by=-scaled_importance
* Identity pattern field name is different for different entities

## Save profile to blockchain

```
const { ContentApi } = require('ucom-libs-wallet');
```

### After the registration before the redirect (like for referrals)

Request URL
```
POST api/v1/myself/transactions/registration-profile
Headers: Auth token
```

Request body:
```
signed_transaction: '{.....}',          // a result of the call of ContentApi.createProfileAfterRegistration
user_created_at: moment().utc().format(),
```

Notes:
* If error is occurred - log it and redirect user. Do not break the registration flow.

[Autotest](../../test/integration/users/profile/profile-registration-transactions.test.ts)

### During a regular profile updating

Attach one more field with the transaction
```
signed_transaction: '{.....}',          // a result of the call of ContentApi.updateProfile
```

Notes:
* provide a full JSON, composed from user profile.
* Process errors as regular - break a cycle if there are any errors.
* fields list

```
const allowedFields: string[] = [
  'id',
  'account_name',
  'first_name',
  'last_name',
  'entity_images',
  'avatar_filename',
  'about',
  'mood_message',
  'created_at',
  'updated_at',
  'personal_website_url',
  'is_tracking_allowed',

  // also all user sources `social networks`
];
```

[Autotest](../../test/integration/users/profile/profile-updating-transactions.test.ts)

## Users list

[Fetch using different filters](../../test/integration/users/get/users-get-graphql.test.ts)

# Feeds

A GraphQL method `getManyPostsQueryPart`

Dictionary
```
const { EntityNames } = require('ucom.libs.common').Common.Dictionary;
const { PostTypes } = require(ucom.libs.common).Posts.Dictionary;

// publications filters
entityNamesFrom = [EntityNames.ORGANIZATIONS]
entityNamesFor   = [EntityNames.ORGANIZATIONS]
ORDER BY '-current_rate'

// direct posts filters (feed)
entityNamesFrom = [EntityNames.ORGANIZATIONS, EntityNames.USERS]
entityNamesFor = [EntityNames.ORGANIZATIONS]
ORDER BY '-id'
```

In order to include comments please specify a comments_query parameters inside the filter.
In order to fetch posts without comment - skip this query

[examples](../../test/helpers/posts/posts-graphql-request.ts)
* A Community main page top publications - `getOrgMainPageTopPublications`
* A Community main page feed - `getOrgMainPageFeed`


An example of users side block request is here:
[here](../../test/helpers/users/many-users-request-helper.ts) (method `getManyTrendingUsersAsMyself`)

