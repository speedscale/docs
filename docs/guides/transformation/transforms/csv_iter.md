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
my_csv = file("s3://employees.csv") -> csv(hasHeader=True, header="Email")
```

And then when we use it in our transforms we'd get

```
csv_iter(csv_name="my_csv") -> outputs john.doe@example.com
csv_iter(csv_name="my_csv") -> outputs jane.smith@example.com
csv_iter(csv_name="my_csv") -> outputs alice.johnson@example.com
csv_iter(csv_name="my_csv") -> outputs bob.brown@example.com
# Loops back to the top
csv_iter(csv_name="my_csv") -> outputs john.doe@example.com
```
