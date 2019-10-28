# Current task docs

This file is for frontend team only

## Multi-signature community

### Multi-signature social permissions assigning through logging out

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

And then, try to call yet another new method of permissions binding - no exceptions must be
```
SocialKeyApi.addSocialPermissionsToProposeApproveAndExecute
```

### Create a multiSignature community
Autotests are [here: Smoke - new organization as a multi-signature](../../test/integration/organizations/organizations-create-update-transactions.test.ts)
Please, notice that `random` is a dedicated method for the auto-tests. You should ask user for the new account_name and keys like for the regular
registration.

Textual description:
* Create a new multi-signature account completely on the frontend.
* Send a regular community information to the backend as usual BUT
* send only a blockchain_id (generate it as in auto-tests), do not send signed_transaction - no such argument, transaction is sent on the frontend.
* place an account_name to the nickname community property. There is NO account_name property for the organization.
* add an extra parameter (backward compatibility)
```
is_multi_signature: true
```

### Update a multiSignature community

Autotests are [here: Smoke - new organization as a multi-signature](../../test/integration/organizations/organizations-create-update-transactions.test.ts)

1. Check are social members changed
```
const areChanged = await MultiSignatureApi.areSocialMembersChanged(multiSignatureAccountName, socialMembersAccountNames);
```

2.A - If they are changed then call the following method providing an active private key
```
await MultiSignatureApi.createAndExecuteProfileUpdateAndSocialMembers
```
2.B  - If they are not changed then call another method proving a social private key
```
await MultiSignatureApi.updateProfile
```
3. Send information to the blockchain BUT provide `signed_transaction` only if a `organization_type_id` is equal to `2`.
Don't forget to update a GraphQL library.
4. Make it impossible to update the nickname because the nickname is equal to the account_name BUT for the same condition:
`organization_type_id = 2` (community is a multi-signature)

### Disable a possibility to make any changes related to the community if the community is not a multi-signature one 

Notes:
* Blocking only on frontend - no backend blocking
* If organization_type_id = 1 then block all community activity and ask for multi-signature registration
* Create a new multi-signature account like for the new community creation process but call the different API:

```
POST /organizations/:organization_id/migrate-to-multi-signature

body:
{
    account_name: 'multisig1234' // a fresh multi-signature account name created by the author
}
```

After the success - redirect the author somewhere

### Make social actions on behalf of a community
TODO
