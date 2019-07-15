# Entities

### Entities list
* Users (Myself as a user state: user + auth token)
* Posts (Publications, reposts, etc.)
* Comments
* Organizations (communities)
* Tags
* Blockchain nodes - for caching blockchain state


### Entities states (response fields structure):
* `Full` - all possible fields
* `Preview` - amount of fields required for lists of entities
* `Card` - minimum amount of fields, used in `object inside object` situations, 
ex. `entity_for` - for whom post is published, User or Organization data.

It is possible that in the future such states will completely be moved to frontend. Because of GraphQL implementation.
