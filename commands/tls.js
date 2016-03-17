'use strict';
var hk = require('heroku-cli-util');
var request = require('request');

module.exports = {
  topic: 'fastly',
  command: 'tls',
  description: 'Add/Remove Fastly TLS to DOMAIN',
  help: 'DOMAIN will be added to a Fastly/Heroku SAN SSL certificate. \n\
Upon addition, you must verify ownership of DOMAIN using either: email, dns, or url \n\
For detail on verification see (some link). \n\
 - Your Fastly Service must have the domain configured in the active version. \n\
 - Your pricing plan must support this feature \n\
 - Wildcard domains are not allowed \n\
For details: https://docs.fastly.com/guides/securing-communications/ordering-a-paid-tls-option#shared-certificate \n\n\
Usage: \n\
   heroku fastly:tls www.example.org -v email --app my-tls-example \n\
   heroku fastly:tls www.example.org --remove --app my-tls-example',
  needsApp: true,
  needsAuth: true,
  args: [
    {name: 'domain', description: 'the domain to add TLS'},
    {name: 'verification_type', description: 'The method to use for domain verification. Must be one of: email, dns, or url', optional: true},
  ],
  flags: [
    {name: 'remove', char: 'r', description: 'Remove TLS from DOMAIN', hasValue: false},
    {name: 'api_key', char: 'k', description: 'Override Fastly_API_KEY config var', hasValue: true},
    {name: 'api_uri', char: 'u', description: 'Override Fastly API URI', hasValue: true}
  ],
  run: hk.command(function* (context, heroku) {

    let base_uri = context.flags.api_uri || 'https://app.fastly.com';
    let config = yield heroku.apps(context.app).configVars().info();
    let api_key = context.flags.api_key || config.FASTLY_API_KEY

    if (!api_key) {
      hk.error("config var FASTLY_API_KEY not found! The Fastly add-on is required to configure TLS. Install Fastly at https://elements.heroku.com/addons/fastly");
    }

    if (context.flags.remove) {
      request({
        method: 'DELETE',
        url: base_uri + '/plugin/heroku/tls',
        headers: { 'Fastly-Key': api_key },
        form: { domain: context.args.domain,
          service_id: config.FASTLY_SERVICE_ID
        }
      }, function(err, response, body) {
        if (response.statusCode != 200) {
          hk.error("Fastly API request Error! code: " + response.statusCode + " " + response.statusMessage + " " + JSON.parse(body).msg);
        } else {
          hk.styledHeader("Domain " + context.args.domain + " queued for TLS removal. This domain will no longer support TLS");
        }
      });

    } else { 
      // domain addition is default command

      if (!context.args.verification_type) {
        hk.error('VERIFICATION_TYPE is required to provision TLS. Use: email, dns, or url');
      }

      request({
        method: 'POST',
        url: base_uri + '/plugin/heroku/tls',
        headers: { 'Fastly-Key': api_key },
        form: {
          domain: context.args.domain,
          verification_type: context.args.verification_type,
          service_id: config.FASTLY_SERVICE_ID
        }
      }, function(err, response, body) {
        if (response.statusCode != 200) {
          hk.error("Fastly API request Error! code: " + response.statusCode + " " + response.statusMessage + " " + JSON.parse(body).msg);
        } else {
          hk.styledHeader("Domain " + context.args.domain + " queued for TLS addition.");
          hk.warn("Follow the instructions for " + context.args.verification_type + " domain verification to complete TLS configuration.");
        }
      });
    }
  })
};
