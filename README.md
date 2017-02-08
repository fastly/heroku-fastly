# Heroku Fastly Plugin

Heroku CLI plugin for interacting with fastly configuration.



# Installation
Install the heroku-fastly plugin using the `heroku plugins` command. More details are available in Heroku's [Devcenter](https://devcenter.heroku.com/articles/using-cli-plugins)

```
$ heroku plugins:install heroku-fastly
```

# Usage
The CLI Plugin includes the commands - `purge`, `verify`, and `tls`.

## TLS
To add TLS to a domain your pricing plan must include a TLS domain and the domain must be configured in the active version of your Fastly Service.
The process involves creating the TLS Domain, verifying ownership of your domain, and checking the verification status of your domain.

```
Usage: heroku fastly:tls DOMAIN [VERIFICATION_TYPE]
```

To add TLS/SSL to a custom domain:

```
heroku fastly:tls www.example.org --app my-fast-app
```
Create a DNS TXT record with the verification string output from this command.

```
heroku fastly:verify start www.example.org --app my-fast-app
```
Verfies ownership of the domain via the DNS TXT record added from output of the previous command.


```
heroku fastly:tls status www.example.org --app my-fast-app
```
Checks the status of the verification process. If complete, a new CNAME will be output that you can update to after the new certificate propages to all caches.


To remove TLS/SSL from a custom domain, include the the `-d` flag:

```
heroku fastly:tls -d www.example.com --app my-fast-app
```

## Purge
Issue a surrogate key purge or purge all. For reference, see the [Purge API docs](https://docs.fastly.com/api/purge)

```
Usage: heroku fastly:purge [KEY]
```

To purge the entire cache

```
heroku fastly:purge --all --app my-fast-app
```

To purge a surrogate-key from the cache

```
heroku fastly:purge my-surrogate-key --app my-fast-app
```

# Development
Clone the repo and run `npm install` to install dependencies.

Further detail on building Heroku CLI plugins is available in the [devcenter](https://devcenter.heroku.com/articles/developing-toolbelt-plug-ins)

## Testing
Tests can be run with `npm test`

## Contributing
Have an issue? Want to see new functionality? Please open an issue or pull request.


