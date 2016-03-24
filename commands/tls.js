'use strict';
var hk = require('heroku-cli-util');
var request = require('request');

module.exports = {
  topic: 'fastly',
  command: 'tls',
  description: 'Add/Remove Fastly TLS to DOMAIN',
  help: 'DOMAIN will be added to a Fastly/Heroku SAN SSL certificate. \n\n\
Requirements: \n\
 - The Fastly Service must have DOMAIN configured in the active version. \n\
 - Heroku pricing plan must include TLS Domain(s)\n\
 - Wildcard domains are not allowed \n\n\
You must verify ownership of DOMAIN after running this command. \n\
Valid VERFICATION_TYPES provided by our CA are: email, dns, url \n\n\
  Email: Email approval sent to addresse(s) the CA specifies as the owner of the domain \n\
  DNS: DNS text record approval. \n\
  URL: Root URL that has a metatag in the head section, where the CA specifies the metatag. Please note that they cannot reside on a page under the root domain.  For example, placing the metatag at `www.example.com/index.html` will **not** work.  It must be placed on `www.example.com`. \n\
For details: https://docs.fastly.com/guides/securing-communications/ordering-a-paid-tls-option#shared-certificate \n\n\
Usage: \n\
   heroku fastly:tls www.example.org dns --app my-fast-app\n\
   heroku fastly:tls www.example.org -d --app my-fast-app',
  needsApp: true,
  needsAuth: true,
  args: [
    {name: 'domain', description: 'the domain to add TLS'},
    {name: 'verification_type', description: 'The method to use for domain verification. Must be one of: email, dns, or url', optional: true},
  ],
  flags: [
    {name: 'delete', char: 'd', description: 'Remove TLS from DOMAIN', hasValue: false},
    {name: 'api_key', char: 'k', description: 'Override Fastly_API_KEY config var', hasValue: true},
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

    if (context.flags.remove) {
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
      // domain addition is default command

      if (!context.args.verification_type) {
        hk.error('VERIFICATION_TYPE is required to provision TLS. Use: email, dns, or url');
        process.exit(1);
      }

      request({
        method: 'POST',
        url: base_uri + '/plugin/heroku/tls',
        headers: { 'Fastly-Key': api_key, 'Content-Type': 'application/json' },
        form: {
          domain: context.args.domain,
          verification_type: context.args.verification_type,
          service_id: config.FASTLY_SERVICE_ID
        }
      }, function(err, response, body) {
        if (response.statusCode != 200) {
          hk.error("Fastly API request Error! code: " + response.statusCode + " " + response.statusMessage + " " + JSON.parse(body).msg);
          process.exit(1);
        } else {
          hk.styledHeader("Domain " + context.args.domain + " queued for TLS addition.");
          hk.warn("Follow the instructions for " + context.args.verification_type + " domain verification to complete TLS configuration.");
        }
      });
    }
  })
};
