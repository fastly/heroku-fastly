'use strict';
var hk = require('heroku-cli-util');
var request = require('request');
var base_uri = 'http://app.dev.local';

var create_domain = function(data, api_key) {
  request({
    url: base_uri + '/plugin/heroku/tls',
    method: 'POST',
    headers: { 'Fastly-Key': api_key },
    form: data
  }, function(err, response, body) {
    if (response) {
      console.log(response);
    }
    if (err) {
      throw new Error("Request Error: " + err);
    }
  });
};

var remove_domain = function(data, api_key) {
  request({
    url: base_uri + '/plugin/heroku/tls',
    method: 'DELETE',
    headers: { 'Fastly-Key': api_key },
    form: data
  }, function(err, response, body) {
    if (response) {
      console.log(response);
    }
    if (err) {
      throw new Error("Request Error: " + err);
    }
  });
};
}

module.exports = {
  topic: 'fastly',
  command: 'tls',
  description: 'Heroku CLI plugin for Fastly TLS configuration',
  help: 'Add or remove a domain for use with TLS. \n\
   Domains will be added to a SAN certificate. For details see: https://docs.fastly.com/guides/securing-communications/ordering-a-paid-tls-option#shared-certificate \n\n\
   Usage: \n\
   heroku fastly:tls -c -d www.example.org -v email -a my-example-app',
  needsApp: true,
  needsAuth: true,
  flags: [
        {name: 'create', char: 'c', description: 'Add the provided domain to a Fastly SAN certificate', hasValue: false},
        {name: 'remove', char: 'r', description: 'Remove domain from a Fastly SAN certficate', hasValue: false},
        {name: 'domain', char: 'd', description: 'The fully qualified domain name to add to a Fastly SAN certificate', hasValue: true},
        {name: 'verification', char: 'v', description: 'The domain verification method to use - valid types are email, dns, or url', hasValue: true}
    ],

  run: hk.command(function* (context, heroku) {
    let config = yield heroku.apps(context.app).configVars().info();

    if (!config.FASTLY_API_KEY) {
      throw new Error("FASTLY_API_KEY not found! The Fastly add-on is required to configure TLS. Install Fastly at https://elements.heroku.com/addons/fastly");
    }

    if (context.flags.create) {
      req_data = {
        domain: context.flags.domain,
        verification_type: context.flags.verification_type
      }
      create_domain(req_data, config.FASTLY_API_KEY);
    } else if (context.flags.remove) {
      req_data = {
        domain: context.flags.domain,
      }
      remove_domain(req_data, config.FASTLY_API_KEY);

    } else {
      throw new Error("You must specify an action! Use create (-c) or remove (-r)");
    }
  })

}
