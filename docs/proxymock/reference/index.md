# How it works

**proxymock** works by capturing real traffic through a proxy that listens to the API and database calls coming into, and going out of, your application. Once **proxymock** has captured the requests and responses you can automagically turn them into [mocks](/reference/glossary.md#mock) and [tests](/reference/glossary.md#test).

Because **proxymock** uses a proxy there is no need to change your code, environment variables, database connections, or anything else about your application. **proxymock** is a passive listener.

## [Architecture](./architecture.md) {#architecture}

Learn more about how **proxymock** introduces transparent proxies and replays traffic from your application.

## [Signatures](./signature.md) {#signature}

Learn how mocks match requests to responses. This also includes information about how to modify signatures to fit your needs.

## [Lifecycle](./lifecycle.md) {#lifecycle}

Learn how to create, edit, and use snapshots in **proxymock**.
