---
description: "Fail a replay when a database statement returns different rows, row counts or errors than it did when it was recorded, for Postgres, MySQL and SQL Server."
sidebar_position: 8
---

# SQL Output

The `sqlOutput` assertion compares what each replayed database statement returned with what the same statement returned when it was recorded: every result set, its rows, its row count and its error.

It applies when a replay sends recorded Postgres, MySQL or SQL Server statements to a real database, as in [Load and Regression Test a Database](/proxymock/databases/load-and-regression-testing/). A statement can succeed on both runs and still return other rows, for example after a migration changes a default, a query plan returns rows in another order, or test data drifts. A replay that only checks for errors passes it; this assertion fails it.

It judges the replay as a whole rather than each replayed request, so it does not change the per-request assertion counts or the result-match goals. A difference adds a notification to the report, which then ends in Missed Goals.

### Example <a href="#example" id="example"></a>

```javascript
{
  "type": "sqlOutput",
  "config": {
    "ordered": "false",
    "ignoreColumns": "updated_at,3"
  }
}
```

### Configuration <a href="#configuration" id="configuration"></a>

| Key | Description |
| --- | --- |
| **compareRows** | Compare complete result rows. Defaults to `true`. Set it to `false` to compare row counts and errors only, which reports partial coverage. |
| **ordered** | Compare rows in the order they were returned, for queries whose order is deterministic, such as those with `ORDER BY`. By default rows are compared as a multiset: the same rows, each the same number of times, in any order. |
| **ignoreColumns** | Comma-separated column names or zero-based column indices to leave out of the row comparison, such as a timestamp the database sets. Some results carry no column names, a Postgres prepared statement Execute and a SQL Server execute sent without metadata, so name their columns by index. |

The assertion's group filters choose which statements it compares, as for any assertion.

### What is compared <a href="#what-is-compared" id="what-is-compared"></a>

Each statement's results are compared in order, one result set at a time.

| | Postgres | MySQL | SQL Server |
| --- | --- | --- | --- |
| Statements | Queries and prepared statement Executes | Queries and prepared statement executes | Batches, `sp_executesql`, `sp_prepexec`, `sp_execute` and stored procedure calls |
| Result sets | Each statement of a multi-statement query | Each result set | Each result set of a batch or procedure |
| Row count | The command tag, such as `UPDATE 3` | The affected-row count | The count each statement reports, such as `SELECT 3` or `UPDATE 3` |
| Errors | The SQLSTATE | The error number and SQLSTATE | The error number, class and state |
| Also | | Column types | Column types, the return status and OUTPUT parameters |

Error message text is not compared, because it often holds the failing value, such as the duplicate key. SQL Server informational messages, such as `PRINT` output, are not compared.

Values are compared as the database returns them, so a `decimal(10,2)` that becomes `decimal(10,4)`, a `datetimeoffset` with another offset, or a NULL that becomes an empty string is a difference. A MySQL date, time or number compares the same whether the recording and the replay decoded it as text or as a typed value.

Some values differ on every run and are never compared: the MySQL last insert ID, and the statement handle `sp_prepexec` returns.

### Complete and partial coverage <a href="#coverage" id="coverage"></a>

A replay keeps at most 20 rows of each result, to bound its memory, so the rows only prove a match when they are all there. A statement whose rows the replay kept in full is compared row by row. One where some rows were not kept is compared on its row count and error only, and reported as partial.

| Engine | Rows are complete when |
| --- | --- |
| Postgres | The command tag counts as many rows as were kept |
| SQL Server | The statement's row count equals the rows kept; with `SET NOCOUNT ON` there is no count, so when the replay kept fewer than 20 rows |
| MySQL | A result set carries no row count, so when the replay kept fewer than 20 rows |

The generator's low data mode keeps no rows, so every statement is partial. `compareRows: false` makes every statement partial too.

### Results <a href="#results" id="results"></a>

Each statement gets one of these results:

| Result | Meaning |
| --- | --- |
| Match | The results are the same, compared in full. |
| Partial | The row counts and errors are the same; the rows were not compared in full. |
| Different | A result set, row, row count, error, return status or OUTPUT parameter differs, or the number of result sets differs. |
| Unavailable | The comparison could not run: the recorded statement is missing, the reply was cut short, or it holds output the comparison does not read. |

The report's **Accuracy** tab shows the results under **SQL output**, with each statement's expected and actual results side by side. They are also written to the report artifact `sql-diff.json`.

### When the comparison cannot run <a href="#when-the-comparison-cannot-run" id="when-the-comparison-cannot-run"></a>

The assertion fails with its reason when the replay sent no database statements it could compare, for example because the group filters matched none.

A statement is reported as unavailable, and counts as a difference, when:

- the recording of the statement is missing, or recorded another database engine,
- the replayed reply is incomplete,
- the reply is Postgres `COPY` or a suspended portal, MySQL `LOAD DATA LOCAL INFILE`, or a SQL Server reply the client cancelled.

### Limits <a href="#limits" id="limits"></a>

- The assertion is scored only in Speedscale Cloud replay reports. A local `proxymock replay` does not evaluate it.
