# Import HTTP Wire Format

Speedscale can import traffic stored in files matching the HTTP network wire format. HTTP Wire Format is the format you would see if observing an HTTP transaction via a network packet sniffing tool like Wireshark. This format is also common with Service Virutalization tools. This command can be used for migration purposes.

Each request should be in a file titled `Req{val}.txt` and each response should be in a file called `Res{val}.txt`. Note: `{val}` should be an increasing integer (ex: Req1.txt/Res1.txt, Req2.txt/Res2.txt, etc). There is no limit on the number of request/response file pairs can be imported at once.

The format of the request text file should match this example:

```
POST /foo-platform/pdt/foo/management HTTP/1.1
SOAPAction: http://speedscale.com/blah
Content-Type: application/xml; charset=ISO-8859-1

<?xml version="1.0" encoding="UTF-8"?><soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:awsse="http://xml.amadeus.com/2010/06/Session_v3" xmlns:wsa="http://www.w3.org/2005/08/addressing"></soap:Envelope>
```

The response file would look something like this:
```
HTTP/1.1 200 OK
Content-Type: text/xml
Ama-TraceID: 0084232588
Ama-Tracker: AMA_SEA_PDT_2023-11-17T19:08:46Z_0084232588
Ama-ProcessingTime: 144

<?xml version="1.0" encoding="UTF-8"?><soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:awsse="http://xml.amadeus.com/2010/06/Session_v3" xmlns:wsa="http://www.w3.org/2005/08/addressing"></soap:Envelope>
```

These are the same bytes that would be sent for this HTTP interaction over the network.

### Import

To import a set of request/response file pairs you must first zip them together. All files should be in the root directory.

```
speedctl import http-wire --name {SNAPSHOT_NAME} --service-name {SERVICE_NAME} --from {ZIPFILE} {FLAGS}
```

ZIPFILE is a zip file containing the complete set of `Req/Res` files. A snapshot will be created containing mocks with these requests.

### Questions?

Feel free to ask questions on the [Community](https://slack.speedscale.com)!
