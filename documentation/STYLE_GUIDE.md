# Style guide

Table of contents:
* [Linter](#linter)
* [Conventions](#conventions)
    * [Basic](#basic)
    * [Autotests](#autotests)
    * [Naming](#naming)
    * [Commenting](#commenting)
    * [Database](#database)
    


## Linter
It is required to follow the eslint rules declared in [.eslintrc.js](../.eslintrc.js). 
In order to check your code, run the following command:

```
make docker-check-by-eslint
```

## Conventions

*Notice:* Most of the existing code was written in JavaScript and then rewritten to TypeScript.
Because of this, some of the conventions are not satisfied by the "old code", only for the new one.

### Basic
* **Don't** write new project files in JavaScript.
* **Do** write new project files in TypeScript.
* **Do** provide a type for every variable, argument and function return type. 

* TODO is not allowed for code pushed to master. It is allowed only during development stage.

### Project structure
* All blockchain related code should be placed to `ucom.libs.wallet` library.


### Autotests
* **Do** write autotests for new functions. TDD style is preferable.

* **Don't** use `pre-defined seeds`. Some old-written autotests are still using them.
* **Do** use `generators` - [generators folder](../test/generators), [usage example](../test/integration/tags/tags-get.test.ts)

**Do** use blockchain application mock methods. Example - [mockUosAccountsPropertiesFetchService method](../test/integration/helpers/mock-helper.ts)

### Naming

Do not | Do 
--- | ---
- | `entity` prefix for objects like `team`, `tags`, etc. which might be used for several entities (for example, both `organization` and `post` might have `tags`, so the proper table name should be `entity_tags`, not`organizaton_tags`, `post_tags`)
`getSinglePost`, `getPosts` | `One/Many`, for ex. `getOnePost`, `getManyPosts`.
`userFromId` and somewhere `entityToId` | `userIdFrom`, `entityIdTo` - consistent naming strategy


### Commenting

Don't use | Do use
--- | ---
TODO mark | tags which represents comments reason.

In order to mark hardcode, raw, bad-optimised fragments, etc. - use such structure:
```
[tag_name] - [description]
```
Description must include a reason of a described code structure.

Comments reason tags

title | description
--- | ---
#task | general tag. Avoid if possible
#hardcode | hardcode
#optimize | parts of code to optimise (ex. performance) in the future
#tech-debt | technical debt

TODO - This section is not ready yet. This will populated with links to files that represent project conventions

## Database

Don't use | Do use
--- | ---
Create tables inside the public (default) schema | All new tables should be created inside the schemas different from public. [Example](../migrations_knex_monolith/20190401121234-create-table-blockchain-irreversible-traces.js)
camelCase, uppercase and plural naming rules for database objects | snake_case, lowercase (users_activity, blockchain_nodes, etc) 

## Error handling
* Avoid 500 responses, add extra validation.
