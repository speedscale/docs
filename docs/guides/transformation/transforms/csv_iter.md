---
description: "Utilize the CSV Iterator in Speedscale to read and inject values from CSV files for efficient API testing and traffic replay in your applications"
sidebar_position: 5
---

# CSV Iterator

### Purpose

`csv_iter` reads the next row from a given csv and inject the value every time it is called. For the given csv

| Name          | Email                     | ID    |
| ------------- | ------------------------- | ----- |
| John Doe      | john.doe@example.com      | 12345 |
| Jane Smith    | jane.smith@example.com    | 67890 |
| Alice Johnson | alice.johnson@example.com | 24680 |
| Bob Brown     | bob.brown@example.com     | 13579 |

We'd setup our variables like this

```
my_csv = file("dataframe:employees__data.csv") -> csv(hasHeader=True, header="Email")
```

The `dataframe:` prefix is a portable filename — it resolves to user data in the Speedscale cloud and to a local workspace file under `proxymock/dataframes/` during a local proxymock replay. You can also reference cloud-only user data directly with `s3://employees.csv`, or use an absolute local path. See the [file extractor](../extractors/file.md) for the full description of all three forms.

And then when we use it in our transforms we'd get

```
csv_iter(csv_name="my_csv") -> outputs john.doe@example.com
csv_iter(csv_name="my_csv") -> outputs jane.smith@example.com
csv_iter(csv_name="my_csv") -> outputs alice.johnson@example.com
csv_iter(csv_name="my_csv") -> outputs bob.brown@example.com
# Loops back to the top
csv_iter(csv_name="my_csv") -> outputs john.doe@example.com
```
