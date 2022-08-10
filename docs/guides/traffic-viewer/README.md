
# Traffic Viewer

The Traffic Viewser provides a detailed log of every transaction in the system.

Click on one of the instances to open the Traffic Viewer which provides:

* A time picker to look at trends during specific time windows
* Throughput graphs for inbound calls to the service and outbound calls to backend systems
* Filters for searching for specific transactions or otherwise customizing the list

![Traffic Viewer](./observe-traffic-viewer.png)

### Filtering <a href="#analyze-steps" id="analyze-steps"></a>

Utilize the filters to drill down even further into a subset of transactions or to filter out unwanted traffic like heartbeats.

![Filters](./select-filters.png)

:::info
Did you know that you can filter traffic so that it is never sent to Speedscale cloud? This can help you prevent noise, lower your bill and keep private data safe. Check out the [filters](../../reference/filters) section for suggestions.
:::

### Request Response Details <a href="#overview" id="overview"></a>

Clicking on any individual row reveals a Request / Response Pair. This could be for an inbound transaction to the service,
or even a call from the service to a downstream system, even if it uses TLS. The following information is shown in the view:

* **Info** section includes high level details like response code, duration, URL, etc.
* **Request** section includes the Headers and Body that were sent
* **Response** section includes the Headers and Body that were received

![Request Response Pair](../../observe-rrpair.png)

Now that you have identified the subset of traffic that you would like to replay, it's time to create a snapshot.
