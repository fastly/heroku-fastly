'use strict';
var hk = require('heroku-cli-util');
var request = require('request');
var base_uri = 'http://app.dev.local';

module.exports = {
  topic: 'fastly',
  command: 'tls',
  description: 'Configure Fastoku TLS',
  help: 'Add/Remove Fastly TLS for DOMAIN \n\
DOMAIN will be added to a Fastly/Heroku SAN SSL certificate. \n\
Upon addition, you must verify ownership of DOMAIN using either: email, dns, or url \n\
For detail on verification see (some link). \n\
 - Your Fastly Service must have the domain configured in the active version. \n\
 - Your pricing plan must support this feature \n\
 - Wildcard domains are not allowed \n\
For details: https://docs.fastly.com/guides/securing-communications/ordering-a-paid-tls-option#shared-certificate \n\n\
Usage: \n\
   heroku fastly:tls www.example.org --add -v email --app my-tls-example \n\
   heroku fastly:tls www.example.org --remove --app my-tls-example',
  needsApp: true,
  needsAuth: true,
  args: [ {name: 'domain'} ],
  flags: [
        {name: 'remove', char: 'r', description: 'make a cert removal', hasValue: false},
        {name: 'add', char: 'd', description: 'make a cert addition', hasValue: false},
        {name: 'verification', char: 'v', description: 'The verification method to use - email, dns, or url', hasValue: true}
    ],

  run: hk.command(function* (context, heroku) {
    let config = yield heroku.apps(context.app).configVars().info();

    if (!config.FASTLY_API_KEY) {
      throw new Error("FASTLY_API_KEY not found! The Fastly add-on is required to configure TLS. Install Fastly at https://elements.heroku.com/addons/fastly");
    }

    if (context.flags.add) {
      request({
        method: 'POST',
        url: base_uri + '/plugin/heroku/tls',
        headers: { 'Fastly-Key': config.FASTLY_API_KEY },
        form: {
          domain: context.args.domain,
          verification_type: context.flags.verification
        }
      }, function(err, response, body) {
        if (response.statusCode != 200) {
          hk.error("Fastly API request Error! code: " + response.statusCode + " msg: " + response.statusMessage);
        } else {
          hk.styledHeader(context.args.domain + " queued for certificate addition. The domain will not be added until you verify ownership using the provided verification type!");
          hk.styledHeader("Please follow the instructions for " + context.flags.verification + " verification");
        }
      });

    } else if (context.flags.remove) {

      request({
        method: 'DELETE',
        url: base_uri + '/plugin/heroku/tls',
        headers: { 'Fastly-Key': api_key },
        form: { domain: context.args.domain }
      }, function(err, response, body) {
        if (response.statusCode != 200) {
          hk.error("Fastly API request Error! code: " + response.statusCode + " msg: " + response.statusMessage);
        } else {
          hk.styledHeader(context.args.domain + " queued for certificate removal. This domain will no longer support Fastoku TLS");
        }
      });

    } else {
      throw new Error("You must specify an action with --add or --remove!");
    }
  })

}
