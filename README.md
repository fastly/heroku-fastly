# Heroku Fastly Plugin

Heroku CLI plugin for interacting with fastly configuration.

# Installation

```
$ heroku plugins:install heroku-fastly
```

# Usage

```
$ heroku fastly:tls --help
Usage: heroku fastly:tls

Heroku CLI plugin for Fastly TLS configuration

 -c, --create        # Add the provided domain to a Fastly SAN certificate
 -r, --remove        # Remove domain from a Fastly SAN certficate
 -d, --domain DOMAIN # The fully qualified domain name to add to a Fastly SAN certificate
 -v, --verification VERIFICATION # The domain verification method to use - valid types are email, dns, or url
 -a, --app APP       # app to run command against
 -r, --remote REMOTE # git remote of app to run command against

Add or remove a domain for use with TLS.
   Domains will be added to a SAN certificate. For details see: https://docs.fastly.com/guides/securing-communications/ordering-a-paid-tls-option#shared-certificate
   Usage:

   heroku fastly:tls -c -d www.example.org -v email -a my-example-app
```

# Development


## Testing


