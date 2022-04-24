# one_of

### Purpose

**one_of** inserts a value from a list either randomly or in sequence. This transform has many uses but as one example, let's say you have an application that talks to an authentication service that cannot be simulated. `one_of` is a transform that will insert different user names in sequence so that the same login transaction can be run multiple times over and over using different user names.

### Usage

```
"type": "one_of",
"config": {
    "strategy": "<sequential or random>",
    "options": "<comma delimited list of strings>"
}
```

### Example

#### Configuration

```
"type": "one_of",
"config": {
    "strategy": "sequential",
    "options": "1,2,3,4,5"
}
```

#### Input Token

`5476`

#### Transformed Token

`1`
(next run)
`2`
(next run)
`3`
(and so on)