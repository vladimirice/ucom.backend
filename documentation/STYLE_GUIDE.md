# Style guide


## Linter
It is required to follow eslint rules, declared in [.eslintrc.js](../.eslintrc.js). 
In order to check your code run the following command:

```
make docker-check-by-eslint
```

## Conventions

*Notice:* Most of the existing code was written on Javascript and then rewritten to Typescript.
Because of this some of conventions are not satisfied by "old code", only for new one.

### Basic
* **Don't** write new project files on Javascript language.
* **Do** write new project files on Typescript language.
* **Do** provide type for every variable, argument and function return type. 

### Autotests
* **Do** write autotests for new functions. TDD style is preferable.

* **Don't** use `pre-defined seeds`. Some old-written autotests are still using them
* **Do** use `generators`. [Example](../test/integration/tags/tags-get.test.ts)

### Naming
* **Do** use `entity` prefix for objects like `team`, `tags`, etc. which are might be used for several entities
(for example, both `organization` and `post` might have `tags`, so proper table name should be `entity_tags`, not
`organizaton_tags`, `post_tags`) 


TODO - This section is ready yet. Here will be placed links to files that represent project conventions
