'use strict';
var hk = require('heroku-cli-util');
var request = require('request');

module.exports = {
  topic: 'fastly',
  command: 'tls',
  description: 'Add/Remove Fastly TLS to DOMAIN',
  help: 'DOMAIN will be added to a Fastly Heroku SAN SSL certificate. \n\n\
Requirements: \n\
 - The Fastly Service must have DOMAIN configured in the active version \n\
 - Heroku pricing plan must include TLS Domain(s) \n\
 - Wildcard domains are not allowed \n\n\
You must verify ownership of DOMAIN after running this command. \n\
Valid VERIFICATION_TYPES: dns\n\
  DNS: Create a DNS TXT record with the provided metatag via your DNS provider. \n\
Usage: \n\
  heroku fastly:tls www.example.org dns --app my-fast-app\n\ ',
  needsApp: true,
  needsAuth: true,
  args: [
    {name: 'domain', description: 'The domain for TLS configure'},
  ],
  flags: [
    {name: 'delete', char: 'd', description: 'Remove TLS from DOMAIN', hasValue: false},
    {name: 'api_key', char: 'k', description: 'Override FASTLY_API_KEY config var', hasValue: true},
    {name: 'api_uri', char: 'u', description: 'Override Fastly API URI', hasValue: true}
  ],
  run: hk.command(function* (context, heroku) {

    let base_uri = context.flags.api_uri || 'https://app.fastly.com';
    let config = yield heroku.apps(context.app).configVars().info();
    let api_key = context.flags.api_key || config.FASTLY_API_KEY

    if (!api_key) {
      hk.error("config var FASTLY_API_KEY not found! The Fastly add-on is required to configure TLS. Install Fastly at https://elements.heroku.com/addons/fastly");
      process.exit(1);
    }

    if (context.flags.delete) {
      request({
        method: 'DELETE',
        url: base_uri + '/plugin/heroku/tls',
        headers: { 'Fastly-Key': api_key, 'Content-Type': 'application/json' },
        form: { domain: context.args.domain,
          service_id: config.FASTLY_SERVICE_ID
        }
      }, function(err, response, body) {
        if (response.statusCode != 200) {
          hk.error("Fastly API request Error! code: " + response.statusCode + " " + response.statusMessage + " " + JSON.parse(body).msg);
          process.exit(1);
        } else {
          hk.styledHeader("Domain " + context.args.domain + " queued for TLS removal. This domain will no longer support TLS");
        }
      });

    } else { 
      request({
        method: 'POST',
        url: base_uri + '/plugin/heroku/tls',
        headers: { 'Fastly-Key': api_key, 'Content-Type': 'application/json' },
        form: {
          domain: context.args.domain,
          verification_type: 'dns',
          service_id: config.FASTLY_SERVICE_ID
        }
      }, function(err, response, body) {
        if (response.statusCode != 200) {
          hk.error("Fastly API request Error! code: " + response.statusCode + " " + response.statusMessage + " " + JSON.parse(body).msg);
          process.exit(1);
        } else {
          var json = JSON.parse(body)
          hk.styledHeader("Domain " + context.args.domain + " has been queued for TLS certificate addition. This may take a few minutes.");
          hk.warn("In the mean time, start the domain verification process by creating a DNS TXT record containing the following content: \n");
          hk.warn("globalsign-domain-verification=" + json.metatag);
          hk.warn("Once you have added this TXT record you can start the verification process by running:\n");
          hk.warn("$ heroku fastly:verify start DOMAIN —app APP");
          }
      });
    }
  })
};
