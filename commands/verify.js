'use strict';
var hk = require('heroku-cli-util');
var request = require('request');

module.exports = {
  topic: 'fastly',
  command: 'verify',
  description: 'Trigger the domain verification process after running a successful `fastly:tls` execution.',
  help: 'This validates the metatag you set as a DNS TXT record or as metatag in the html of your root page.'
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

  request({
    method: 'GET',
    url: base_uri + '/plugin/heroku/tls/status',
    headers: { 'Fastly-Key': api_key, 'Content-Type': 'application/json' },
    form: {
      domain: context.args.domain,
      verification_type: context.args.verification_type,
      service_id: config.FASTLY_SERVICE_ID
    }
  }, function(err, response, body) {
    if (response) {

    request({
      method: 'POST',
      url: base_uri + '/plugin/heroku/tls/verify',
      headers: { 'Fastly-Key': api_key, 'Content-Type': 'application/json' },
      form: {
        domain: context.args.domain,
        verification_type: context.args.verification_type,
        service_id: config.FASTLY_SERVICE_ID
      }, function(err, response, body) {
      });

    } else {
      hk.error('fukkd');
      process.exit(1);
    }
  });


  })
};
