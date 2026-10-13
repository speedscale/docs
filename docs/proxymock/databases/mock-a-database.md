---
title: Mock a database
description: "Run your app against a mock of its PostgreSQL, MySQL, MongoDB or Redis database built from a proxymock recording, so tests and AI coding assistants run with no database at all."
---

# Mock a database

`proxymock mock` answers your app's database calls from a recording, so the app runs with no database: no container to start, no data to seed, and the same answers every time. That makes a database-backed service testable on a laptop, in CI and by an AI coding assistant, and it keeps tests from depending on what a shared database happens to hold.

## Run the mock

Record once with the database mapped, then start the mock with the same mapping and your app pointed at it:

```bash
proxymock record --map 15432=postgres://localhost:5432 -- your-app   # once, against the real database
proxymock mock --map 15432=postgres://localhost:5432 -- your-app     # from now on, no database needed
```

The mapping tells proxymock which port speaks which protocol. In mock mode, calls that match a recording are answered from it, and the mock's output says which calls matched and which did not. The setup pages show the client configuration for each database: [PostgreSQL](./record/postgresql.md), [MySQL](./record/mysql.md), [MongoDB](./record/mongodb.md) and [Redis](./record/redis.md).

## When a call does not match

A SQL mock matches on the statement, normalized so whitespace and comments do not matter, and not on the values bound to it, so every execution of a prepared statement matches its recordings and they are served in turn. Transaction control such as `BEGIN` and `COMMIT` is answered directly. When nothing matches exactly, the mock server falls back to the statement with its literals masked, then to its shape, and tags the mocks it served that way. When the value should pick the answer, such as the id a lookup asks for, a transform makes it part of the match.

- [Matching SQL mocks](../../guides/databases/mock-a-database.md) explains what a SQL mock matches on, what it does when nothing matches exactly, and the transforms that make it match on the values that matter.
- [Improve Mock Match Rate with AI](../guides/mock-match-rate.md) has an AI assistant find the calls that missed and write the blueprint that fixes them.

## Test the database itself

Mocking replaces the database. To test the database instead, a new schema, a migration or a new version, replay the recorded statements against it. See [Load and Regression Test a Database](./load-and-regression-testing.md).
