# Style guide


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

### Autotests
* **Do** write autotests for new functions. TDD style is preferable.

* **Don't** use `pre-defined seeds`. Some old-written autotests are still using them.
* **Do** use `generators` - [generators folder](../test/generators), [usage example](../test/integration/tags/tags-get.test.ts)

### Naming
* **Do** use `entity` prefix for objects like `team`, `tags`, etc. which might be used for several entities
(for example, both `organization` and `post` might have `tags`, so the proper table name should be `entity_tags`, not
`organizaton_tags`, `post_tags`) 
* **Don't** use `getSinglePost`, `getPosts`.
* **Do** use `One/Many`, for ex. `getOnePost`, `getManyPosts`.


TODO - This section is not ready yet. This will populated with links to files that represent project conventions
