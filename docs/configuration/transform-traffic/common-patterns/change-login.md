# Change Username

Generally speaking, usernames and password in test environments will not match production logins. This example shows how to insert new usernames into a request JSON payload. This example shows you how to change production usernames into test environment usernames.

Keep in mind that this is typically not necessary if you are using the Speedscale Responders. If the Responder is mocking the connection between the Service Under Test (SUT) and the authentication service, it will provide the same list of valid users as the production system because that's what it recorded in production. However, this example is provided in case you are unable to record the interactions between the SUT and  the authentication service.

#### Objective

Change a username recorded in production to a test username provided by us.

#### Download Repository

The data necessary for this example can be found in the Speedscale github repository:

```
git clone https://github.com/speedscale/example-config
```

#### Configuration

Switch to the `change_login` directory.

Inspect `rotate_login.json`. Inside is a complete example for a tokenconfig that will direct the generator to switch out the `username` JSON key in the request body with one of a predefined set of usernames. So if in the production traffic recording the username was `user1`, it will be replaced with one of the list of three different usernames. For more information on the `one_of` transform see the [one_of transform](../transforms/one_of.md).

Inspect the request payloads in `raw.jsonl`. Use this jq command for simplicity:
```
cat raw.jsonl | jq -r '.http.req.bodyBase64 | @base64d'
```

```
{
    "username":"super_secret_user"
}
{
    "username":"not_so_super_secret_user"
}
```

The jq output will show the original recorded usernames in the JSON payload. You'll see these change after running the transform.

#### Experiment

Run the following command to analyze `raw.jsonl` using the the configuration in `change_login.json`.

```
speedctl transform raw.jsonl change_login.json
```

This command will create an `action.jsonl` file that shows what will be sent to the application in the form of RRPairs. In other words, the `action.jsonl` shows the request the generator will send to the application and expect in response.

Run the same jq command against the `action.jsonl` and you should see that the JSON contains new usernames.

```
cat action.jsonl | jq -r '.http.req.bodyBase64 | @base64d'
```

```
{
    "username":"Dia"
},
{
    "username":"Ken"
}
```

To run this transform configuration in your environment copy/paste the contents of `rotate_login.json` into a new tokenconfig in your tenant and use it in your replay configuration.

:::info
Join slack.speedscale.com to ask real time questions. Our expert engineers are always happy to help with configuration issues.
:::
