'use strict';
let cli = require('heroku-cli-util');
var request = require('request');
let co  = require('co');

function* app (context, heroku) {
  let base_uri = context.flags.api_uri || 'https://app.fastly.com';
  let config = yield heroku.apps(context.app).configVars().info();
  let api_key = context.flags.api_key || config.FASTLY_API_KEY

  if (!api_key) {
    cli.error("config var FASTLY_API_KEY not found! The Fastly add-on is required to configure TLS. Install Fastly at https://elements.heroku.com/addons/fastly");
    process.exit(1);
  }

  var url_params = "?domain=" + context.args.domain + "&service_id=" + config.FASTLY_SERVICE_ID;

  let resp = ''
  request({
    method: 'GET',
    url: base_uri + '/plugin/heroku/tls/status' + url_params,
    headers: { 'Fastly-Key': api_key, 'Content-Type': 'application/json' }
  },
  function(err, response, body) {
    if (response.statusCode != 200) {
      cli.error(body);
      process.exit(1);
    }
    else {
      resp = body;
      cli.log(body);
    }
  });

  cli.debug(resp);

  //let approval = yield cli.prompt('which domain?');
  //cli.debug(approval);

  request({
    method: 'POST',
    url: base_uri + '/plugin/heroku/tls/verify',
    headers: { 'Fastly-Key': api_key, 'Content-Type': 'application/json' },
    form: {
      approval: approval,
      domain: context.args.domain,
      service_id: config.FASTLY_SERVICE_ID
    }
    }, function(err, response, body) {
        console.log(body);

        if (response.statusCode != 200) {
          cli.error(body);
        }

      }
  )

}

module.exports = {
  topic: 'fastly',
  command: 'verify',
  description: 'Start domain verification for DOMAIN after successfully running `fastly:tls` and configuring verification metatag in DNS or URL.',
  help: 'This validates the metatag you set as a DNS TXT record or as metatag in the html of your root page.',
  needsApp: true,
  needsAuth: true,
  args: [
    {name: 'domain', description: 'the domain to add TLS', optional: false}
  ],
  flags: [
    {name: 'api_key', char: 'k', description: 'Override Fastly_API_KEY config var', hasValue: true},
    {name: 'api_uri', char: 'u', description: 'Override Fastly API URI', hasValue: true}
  ],
  run: cli.command(co.wrap(app))
};
