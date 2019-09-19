# Current task docs

This file is for frontend team only

## Trust with auto-update API

* Add og:tags to the auto-update based on json_data
* Repost - it's content for postType = auto-update is based on json_data not on the description
* To add filter to the feeds follow JSDoc instruction of such GraphQL methods:

```
getUserNewsFeedQueryPart
getUserWallFeedQueryPart
```

## Trust with auto-update

* Use a different method to sign the Trust/untrust transaction:
```
const { blockchain_id, signed_transaction } = await SocialApi.getTrustUserWithAutoUpdateSignedTransaction();
// or
const { blockchain_id, signed_transaction } = await SocialApi.getUntrustUserWithAutoUpdateSignedTransaction();
```

* Add the blockchain_id to the backend trust/untrust action request as for other post creation request
* Auto-update will be shown in user feed who trust (who acts) - without title and description, only with filled json_data
* json_data content structure is the same as for notifications. Event ids:

```
import { EventsIdsDictionary } from 'ucom.libs.common';

EventsIdsDictionary.getUserTrustsYou();
EventsIdsDictionary.getUserUntrustsYou();
```


## Social key

### Add more social permissions during the authorization:

Check - does social key exist - use checking method
```
SocialKeyApi.getAccountCurrentSocialKey
```
If does not exist - call the same method as for registration, it now grants all permissions at once
```
SocialKeyApi.bindSocialKeyWithSocialPermissions
```

If the social key exist - try to call a new method of permissions binding - no exceptions must be
```
SocialKeyApi.addSocialPermissionsToEmissionAndProfile
```

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

### Authorization using a social key

* проверяем есть ли соц ключ в local storage
* если его нет - разлогиниваем юзера
* юзер как и обычно вводит брейнкей при авторизации
* в фоне генерим и привязываем ему соц ключ
* кладем соц ключ в local storage
* авторизуем юзера. 
* получаем состояние когда и соц ключ и активный ключ есть в local storage

будущее recovery - все то же самое что и выше. 

Case 1: A regular authorization, social key exists
* Create a signature (sign field) by the social_private_key, not the active_private_key.
* Send the social_public_key, not the activity_public_key.

Case 2: Bind/restore a social key - ask user to restore/bind again a social key.
* Use an active private key to generate social key parts:
```
const { SocialKeyApi } = require('ucom-libs-wallet');
const socialKeyParts = SocialKeyApi.generateSocialKeyFromActivePrivateKey(activePrivateKey);
```

* Check out - is it required to bind a social key:
```
const { SocialKeyApi } = require('ucom-libs-wallet');
const socialKey = await SocialKeyApi.getAccountCurrentSocialKey(accountName);

if (socialKey) {
    return; // not required to bind a social key - already exists
}

// bind it
await SocialKeyApi.bindSocialKeyWithSocialPermissions(
    accountName,
    activePrivateKey,
    socialPublicKey,
);

```

* use a social_public_key to generate authorization signature




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
