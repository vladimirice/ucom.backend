# Style guide


## Linter
It is required to follow eslint rules, declared in [.eslintrc.js](../.eslintrc.js). 
In order to check your code run the following command:

```
make docker-check-by-eslint
```

## Conventions

### Basic
* **Don't** write new project files on Javascript language.
* **Do** write new project files on Typescript language.

### Autotests
* **Do** write autotests for new functions. TDD style is preferable.

* **Don't** use `pre-defined seeds`. Some old-written autotests are still using them
* **Do** use `generators`. [Example](../test/integration/tags/tags-get.test.ts)


TODO - This section is ready yet. Here will be placed links to files that represent project conventions
