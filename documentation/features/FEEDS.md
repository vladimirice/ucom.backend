# Feeds

A GraphQL method `getManyPostsQueryPart`

Dictionary
```
const { EntityNames } = require('ucom.libs.common').Common.Dictionary;


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


Community publications example (a part of autotest)
[link](../../test/helpers/posts/posts-graphql-request.ts)
