# Change Username

Generally speaking, usernames and passwords in test environments may not match production logins. This example shows you how to change production usernames into test environment usernames.

Keep in mind that this is typically not necessary if you are using the Speedscale Responders. If the Responder is mocking the connection between the Service Under Test (SUT) and the authentication service, it will provide the same list of valid users as the production system because that's what it recorded in production. However, this example is provided in case you are unable to record the interactions between the SUT and  the authentication service.

## Objective

Change a username recorded in production to a test username provided by us. When you have created your transform it should look something like this:

![Transform](change-login-transform.png)

### Install Demo

The data necessary for this example can be found in the Speedscale github repository:

```
git clone https://github.com/speedscale/demo
```

After you have downloaded the demo, follow the instructions in the `java` directory to deploy the demo and start capturing traffic. The first call should be to the `/login` endpoint. The request body should look like this:

```
{
    "password": "pass",
    "username": "admin"
}
```

Find this traffic in the traffic viewer, and then use the `Save` button to create a snapshot with this traffic.

![Traffic Viewer](change-login-traffic.png)

### Configuration

From the snapshot viewer, select the `Transforms` tab and you can see your set of `Test` transactions that will be sent to the server, and `Mock` transactions to mock out downstream calls. This is how to create this transform:
* Select the `/login` transaction
* Click on the `Request` tab to see the request body
* Click on the pencil next to `username`

![Select](change-login-select.png)

This will open the `Data Transformation Chain` viewer and you can see it has already selected the JSON Path for your `username` key. Now click the `+ Add transform` button and you will see a list of options:

![Transform List](change-login-transform-list.png)

You can see there are many different options available, but for this example select the `Constant` transform which lets you supply your own value, then click `Save`. You can visually see exactly how this value will change by looking at it on the right. Now click `Save` one more time to save the entire chain, and the snapshot will update.

![Transform Chains](change-login-transform-chains.png)

You can visually see an icon next to the `/login` transaction which shows that there are transforms applied to that specific request. Now you can run this snapshot to see what the results look like. Try it out on your own snapshot!

:::info
Join slack.speedscale.com to ask real time questions. Our expert engineers are always happy to help with configuration issues.
:::
