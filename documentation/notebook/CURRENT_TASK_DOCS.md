# Current task docs

This file is for frontend team only

## Social key

### Registration process

1. Generate a social key and other keys
```
// How to generate social key
const { SocialKeyApi } = require('ucom-libs-wallet');
const socialKeyParts = SocialKeyApi.generateSocialKeyFromActivePrivateKey(activePrivateKey);
```

2. Sign should be generated using a social private key, not an active private key
3. Add to the registration request:
    * active_public_key
    * owner_public_key
    * social_public_key // actually not assigned to the user yet
and remove from the registration request following legacy fields
    * brainkey
    * public_key (legacy naming field)
4. Bind the social key - possible only after the registration
```
// How to generate social key
const { SocialKeyApi } = require('ucom-libs-wallet');
await SocialKeyApi.bindSocialKeyWithSocialPermissions(
    accountName,
    activePrivateKey,
    socialPublicKey,
);
```
5. Only after the successful binding - save a social private key to the local storage
6. Redirect user to the main page (a regular registration request)

## Content transactions to the frontend

Add as much data to the post/comment content - as possible. Examples contain only sample minimum data.

* [Send direct posts transaction](../../test/integration/posts/direct-posts/posts-direct-create-update-transactions.test.ts)
* [Send reposts transaction - creation only](../../test/integration/posts/post-repost/posts-reposts-create-transactions.test.ts)
* [Send comments and replies](../../test/integration/comments/comments-create-update-transactions.test.ts)

### Communities
* [Create/update communities](../../test/integration/organizations/organizations-create-update-transactions.test.ts)
* Not required to save users_team
* Not required to save discussions
* But required to save social networks, partnerships.


## Follow/Unfollow - new transactions
[User to user](../../test/integration/users/activity/follow/users-activity-follow-transactions.test.ts)
[User to organization](../../test/integration/organizations/activity/follow/organizations-activity-follow-transactions.test.ts)

## Get vote details
[For posts](../../test/integration/posts/activity/posts-activity-get-users.test.ts)
[For comments](../../test/integration/comments/activity/comments-activity-get-users.test.ts)
[Request itself](../../test/helpers/common/one-entity-request-helper.ts)

## Sign upvote/downvote by frontend application.

Required for:
* all types of posts
* all comments/replies


add post body with a single field inside:
```
{
    signed_transaction: // result of wallet method call, see examples below
}
```

Examples:

[upvote/downvote posts](../../test/integration/posts/activity/posts-activity-transactions.test.ts)

[upvote/downvote comments/replies](../../test/integration/comments/activity/comments-activity-transactions.test.ts)

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

## Referral program

A referral program is a kind of affiliate programs.

### Related services

Name | Description
--- | ---
app-redirect | A separate application which provides affiliate program `click` conversion


### A referral link

A referral link structure:
https://hello.u.community/{referral_program_id}/{referrer_identity}/?{utm_labels_query_string}

An example of staging:
https://staging-hello.u.community/jR/omgomgomgomg

----------------------------------------------

### A frontend part of the registration
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

### A frontend part of referral info

* GraphQL library method - `getOneUserReferralsQueryPart`. An interface - as for the Trust feature.

* how to fetch user referral URL?
`myself.affiliates.referral_redirect_url`

how to fetch a referrer (source_user)?
`myself.affiliates.source_user`
