# GraphQL

## Overview

GraphQL services works the same way and http service whould work. All the functionalities, Snapshot, Repaly are the same. Altough we used a few new concepts. 


In the following Snapshot, We can see that the only difference is `Operation` and `Endpoint`. We're using `Operation` to show the type of query and `Endpoint` for function(s) that has been called in this query. 

![graphql_snapshot](./graphql/graphql-snapshot.png)

## AST JSON

In order to be able to modify GraphQL payloads, in request body tab, we show a JSON representation of the GraphQL query. You can still see the actual GraphQL in the `raw` tab. But in order ot use transformers to modify your request for replay, you need to interact with the JSON representation.

Following is what you will see for this mutation query:
```
mutation {
  createDraft(title:"foo", content:"bar"){
    id,
    title,
    content,
  }
}
```


![graphql_rrpair](./graphql/graphql-rrpair.png)


## Transform Example

Now let's say we want to update the `title` value in the above example in our Snapshot. We can do this with transforms, But we will work with JSON representation GraphQL query. 

![graphql_transforms](./graphql/graphql-transforms.png)

Now that we change our payload, We're ready to replay this Snapshot against our workload.

## GraphQL Replay
When we replay the Snapshot, as highlighted in the picture, we can see the "Actual" replayed payload. Again you will be able to see the GraphQL query in Raw(recorded) and Raw(Actual) tabs.

![graphql_replay](./graphql/graphql-replay.png)
