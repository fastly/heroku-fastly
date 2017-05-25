'use strict';
let cli = require('heroku-cli-util');
var request = require('request');

function* app (context, heroku) {
  let base_uri = context.flags.api_uri || 'https://app.fastly.com';
  let config = yield heroku.apps(context.app).configVars().info();
  let api_key = context.flags.api_key || config.FASTLY_API_KEY;

  if (!api_key) {
    cli.error("config var FASTLY_API_KEY not found! The Fastly add-on is required to configure TLS. Install Fastly at https://elements.heroku.com/addons/fastly");
    process.exit(1);
  }

  var url_params = "?domain=" + context.args.domain + "&service_id=" + config.FASTLY_SERVICE_ID;
  var url = base_uri + '/plugin/heroku/tls/status' + url_params;
  let approval = null;

  if  (context.args.verification_action.toLowerCase() == "start") {
    request.get({url: url, headers: {'Fastly-Key': api_key}}, function (error, response, body) {

    if (!error && response.statusCode == 200) {
      let json = JSON.parse(body);
      cli.warn("Valid approval domains: " + json.metadata.valid_approvals.toString());

      cli.prompt('Type the approval domain to use (or ENTER if only 1): ').then(function (approval) {
        let valid = json.metadata.valid_approvals.indexOf(approval)

        if (valid == -1) {
          cli.error("Entered domain does not match a valid approval. Try again");
          process.exit(1);
        }

        request({
          method: 'POST',
          url: base_uri + '/plugin/heroku/tls/verify',
          headers: { 'Fastly-Key': api_key },
          form: {
            approval: approval,
            domain: context.args.domain,
            service_id: config.FASTLY_SERVICE_ID
          }
        }, function(err, response, body) {
          if (!error && response.statusCode == 200) {
            cli.warn("Domain queued for verification. This may take up to 30 minutes. To check the status, run 'heroku fastly:verify status DOMAIN --app APP'");
          } else {
            cli.error(body);
          }
        });
      });
    }
    else {
      cli.error(body);
    }
  });

}

if (context.args.verification_action.toLowerCase() == "status") {
    request.get({url: url, headers: {'Fastly-Key': api_key}}, function (error, response, body) {

      if (!error && response.statusCode == 200) {
        let json = JSON.parse(body);
        cli.warn("Status: " + json.state);
        if (json.state == "issued") {
          cli.warn("Your certificate has been issued. It could take up to an hour for the certificate to propagate globally.\n")
          cli.warn("To use the certificate configure the following CNAME record: \n")
          var cname = json.dns[0].cname;
          cli.warn("CNAME  " + context.args.domain + "  " + cname);

        } else {
          cli.warn("Your cert has not yet been issued. Please try again shortly.")
        }
      }
      else {
        cli.error(body);
      }
    });
  }

}

module.exports = {
  topic: 'fastly',
  command: 'verify',
  description: 'Start domain verification for DOMAIN after successfully running `fastly:tls` and configuring verification metatag in DNS.',
  help: 'This validates the metatag you set as a DNS TXT record or as metatag in the html of your root page.',
  needsApp: true,
  needsAuth: true,
  args: [
    {name: 'verification_action', description: 'Start the verification process, check on its status, or confirm its completion.', optional: false},
    {name: 'domain', description: 'The domain to verify', optional: false}
  ],
  flags: [
    {name: 'api_key', char: 'k', description: 'Override Fastly_API_KEY config var', hasValue: true},
    {name: 'api_uri', char: 'u', description: 'Override Fastly API URI', hasValue: true}
  ],
  run: cli.command(app)
};
