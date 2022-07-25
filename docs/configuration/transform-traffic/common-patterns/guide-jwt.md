# Guide: Signing JWTs

When replaying traffic, it is important to re-sign JWTs that have expired so that the application accepts these new calls. If you are seeing 401 or 403 errors during replay, that is a strong indicator you need to re-sign your JWTs.

#### Before you begin

* Find the location of the secret or certificate used to sign the JWTs in your Kubernetes cluster. The Speedscale Generator and your application must both use this secret for re-signing to work.

#### Identify and filter transactions that need re-signing

1. Open the traffic viewer and isolate the traffic that needs JWT resigning.

![View Bearer](./view_bearer.png)

JWT tokens are stored in the `Authorization` HTTP request header. The token itself is prefixed with `Bearer `.

2. Create a filter for the transactions containing JWT tokens. For this example, you would click on the magnifying glass next to the location to capture all transactions for endpoint `/authtoken`. There will be more than one so don't define your filter too narrowly.

![New Filter](./new_filter.png)

3. Store the filter for later use by clicking the Save button in the top right of the filter pane. Give it a unique name.

![Create Filter](./create_filter.png)

4. Click the `Advanced` tab to see the raw filter JSON. Copy it to the clipboard, we will be pasting it in a couple steps.

#### Create a traffic transform rule

1. Create a new [Traffic Transform](https://app.speedscale.com/trafficTransforms)
2. Edit JSON and change the `id` to unique name that you will remember (no spaces)
3. Paste your traffic filter into your new transform and modify it to fit in the "generator->filters->filters" section as shown below
4. Replace "insert_secret_name" with the name of the secret from your kubernetes cluster.

```
{
  "id": "standard_jwt",
  "generator": [
    {
      "filters": {
        "filters": [
          {
            "include": true,
            "detectedLocation": "/authtoken"
          }
        ]
      },
      "extractor": {
        "type": "http_req_header",
        "config": {
          "name": "Authorization"
        }
      },
      "transforms": [
        {
          "type": "http_auth",
          "config": {
            "secret": "insert_secret_name"
          }
        }
      ]
    }
  ]
}
```

#### Apply transform to your snapshot

Next time you create a snapshot, use `standard_jwt` as the transform configuration. If you already have a snapshot then copy/paste the above transform configuration into your snapshot transform configuration JSON section and reanalyze. This can be done from the Snapshot Summary page for your snapshot.