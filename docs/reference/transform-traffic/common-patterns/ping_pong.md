# Token Ping Pong

One of the most common patterns in request/response-based applications is for a request to generate an identifier and then have it used in subsequent requests. We call this the token ping pong.

For this specific example let's imagine we have an application that requests a new ID and then uses that ID in the next call as part of its URL.

#### Objective

Have the generator extract an ID from the JSON response body of one request and re-use as part of the URL in the next call.


To be continued!!!