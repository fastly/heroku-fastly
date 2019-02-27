## 2.0.1

### Added

- 🔊 better error reporting

### Changed

- 📝 Changelog now in https://keepachangelog.com/en/1.0.0/ format

## 2.0.0

### Changed

- Rename package from heroku-fastly to @fastly/heroku-plugin

## 1.0.7

### Changed

- Use api.fastly.com instead of app.fastly.com for API access

## 1.0.6

### Changed

- update dependencies

## 1.0.5

### Changed

- downgrade heroku-cli-util dependency

## 1.0.4

### Changed

- upgrade heroku-cli-util dependency

## 1.0.3

### Changed

- set `files` in `package.json`, as now required by ocliff

## 1.0.2

### Added

- improve messaging of `tls` and `verify` commands
- add soft-purge option
- display CNAME when verification is complete

### Changed

- upgrade `fastly` dependency

## 1.0.0

### Added

- first implementation of `verify` command
- improve messaging of `tls` command

### Changed

- less logging

## 0.0.3

### Added

- `tls` command prints CNAME
- improve help text

### Changed

- output copyable metatag for `dns` and `url` verifications
