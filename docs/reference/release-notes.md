---
sidebar_position: 2
---

# Release Notes

## v1.2.576: 2023-05-01

* SPD-5186 Support strict mode in istio


## v1.2.584: 2023-05-02

* SPD-5212 Use signature hash instead of Sprintf to reduce memory usage
* SPD-5196 update hint messages
* SPD-4996 better errors for demo
* SPD-5211 prevent protected uploads
* SPD-5206 add host override
* SPD-5208 handle trace logs
* SPD-4425 Handle GRPC streams in generator
* SPD-5207 some minor fixes

## v1.3.5: 2023-05-09

* SPD-5262 Allow binding of 443
* SPD-5263 add redactor to generator and analyzer
* SPD-5237 hypertables do not support concurrent index creation
* SPD-5237 rrpairs index
* SPD-5262 Add capability for priv port
* SPD-5262 Change operator webhook port to 443
* SPD-5244 Fix vulns
* SPD-4425 Support grpc streams in the responder
* SPD-5253 remove analyzer sequence ordering
* SPD-5237 revert on conflict change
* SPD-5248 activate dlp in generator transforms
* SPD-5237 add debug func
* SPD-5200 add DLP to transform system
* SPD-5227 add transforms to forwarder
* SPD-4425 Guts for grpc stream replay
* SPD-4836 logs
* SPD-5217 create snapshot using existing filter
* SPD-5210 add a simple edit subcommand

## v1.3.17: 2023-05-12

* SPD-5193 speedctl clone snapshot
* SPD-5090 bootstrapping and parse at least the server greeeting
* SPD-4875 Apply istio sidecar config to injected pods only
* SPD-5277 speedmgmt user delete
* SPD-5272 metric logs from warn to debug
* SPD-5274 turn on discover patterns in standard
* SPD-5232 user data rpcs
* SPD-5238 use a consistent key in analysis mode
* SPD-4874 Preserve inferred port for sidecar
* SPD-5270 housekeeping
* SPD-5051 use updated tcp state checks
* SPD-5257 don't include fields

## v1.3.22: 2023-05-15

* SPD-5290 use a dead simple health server
* SPD-5090 build changes and add detected tech/protocol
* SPD-5285 Ensure docker internal host is setup for linux
* SPD-5232 read the file once and no more
* SPD-5232 load file from S3 user data dir

## v1.3.33: 2023-05-16

* SPD-5261 Record responder hits for grpc streams
* SPD-5294 Ensure timestamp on replay events
* SPD-5233 api gateway ingest
* SPD-5090 fix binary parsing for mysql greeting
* SPD-5295 Include port and extra hosts on replay
* SPD-5297 Update tenant name in IDP
* SPD-5292 postman import accept port
* SPD-5090 fix issues with mysql data vis
* SPD-5259 Don't nil out headers needed for protocol detection
* SPD-5287 add speedctl check timeout
* SPD-5234,SPD-5286 speedctl commands for user-data and cron
