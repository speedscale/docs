---
description: >-
  Semantic versioning is used (MAJOR.MINOR.PATCH), release notes are for MAJOR
  and MINOR changes.
---

# Release Notes

## v0.8: 2021-08-23

### Fixed

* Improved speed of rrpair ingestion

### Changed

* The `speedctl` command outputs have changed for consistency purposes

### Added

* New process `collector` to gather logs from the system under test during replays
* Now able to download `speedctl` for Windows

## v0.7: 2021-08-10

### Fixed

* Bug fix for oauth2 tokenizer
* Bug fix for istio support

### Added

* New Traffic Viewer capability
* New assertion for schema comparison
* New assertion support for HTML payloads

## v0.6: 2021-07-14

### Fixed

* Improved speed of report processing from Speedscale cloud

### Added

* New support for tracking postgres calls

## v0.5: 2021-03-09

### Changed

* Report processing performed within Speedscale cloud

### Added

* Initial support for istio
* Support for operator to work with daemonsets
