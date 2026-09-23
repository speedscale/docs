---
description: "Import HTTP Wire Format files into Speedscale to migrate traffic data and create mocks for API testing using request/response pairs in ZIP format."
sidebar_position: 2
---

# Import HTTP Wire Format

Speedscale can import traffic stored in files matching the HTTP network wire format. This is the format you would see when observing an HTTP transaction with a packet analysis tool such as Wireshark. It is also common in service virtualization tools.

Name each request `Req{N}.txt` and its response `Res{N}.txt`, where `{N}` is an increasing integer. For example, pair `Req1.txt` with `Res1.txt`.

The format of the request text file should match this example:

```http
POST /foo-platform/pdt/foo/management HTTP/1.1
SOAPAction: http://speedscale.com/blah
Content-Type: application/xml; charset=ISO-8859-1

<?xml version="1.0" encoding="UTF-8"?><soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:awsse="http://xml.amadeus.com/2010/06/Session_v3" xmlns:wsa="http://www.w3.org/2005/08/addressing"></soap:Envelope>
```

The response file would look like this:

```http
HTTP/1.1 200 OK
Content-Type: text/xml
Ama-TraceID: 0084232588
Ama-Tracker: AMA_SEA_PDT_2023-11-17T19:08:46Z_0084232588
Ama-ProcessingTime: 144

<?xml version="1.0" encoding="UTF-8"?><soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:awsse="http://xml.amadeus.com/2010/06/Session_v3" xmlns:wsa="http://www.w3.org/2005/08/addressing"></soap:Envelope>
```

These are the same bytes that would be sent for this HTTP interaction over the network.

## Import to Speedscale Cloud

Zip the request/response pairs with all files at the root of the archive:

```bash
speedctl import http-wire --name {SNAPSHOT_NAME} --service-name {SERVICE_NAME} --from {ZIPFILE} {FLAGS}
```

The command creates a cloud snapshot containing mocks for the imported request/response pairs.

## Import to local proxymock files

proxymock accepts either the directory or a zip archive:

```bash
proxymock import http-wire ./wire-captures --out ./wire-rrpairs
proxymock mock --in ./wire-rrpairs
```

If a request has no `Host` header, set `--target-host` and `--target-port` so proxymock knows which dependency the mock represents.

### Questions?

Check the current options with `speedctl import http-wire --help` or `proxymock import http-wire --help`.
