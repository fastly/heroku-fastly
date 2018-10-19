'use strict'
const cli = require('heroku-cli-util')
const request = require('request')
const co = require('co')

module.exports = {
  topic: 'fastly',
  command: 'verify',
  description:
    'Start domain verification for DOMAIN after successfully running `fastly:tls` and configuring verification metatag in DNS.',
  help:
    'This validates the metatag you set as a DNS TXT record or as metatag in the html of your root page.',
  needsApp: true,
  needsAuth: true,
  args: [
    {
      name: 'verification_action',
      description:
        'Start the verification process, check on its status, or confirm its completion.',
      optional: false,
    },
    { name: 'domain', description: 'The domain to verify', optional: false },
  ],
  flags: [
    {
      name: 'api_key',
      char: 'k',
      description: 'Override Fastly_API_KEY config var',
      hasValue: true,
    },
    { name: 'api_uri', char: 'u', description: 'Override Fastly API URI', hasValue: true },
  ],
  run: cli.command(function(context, heroku) {
    return co(function*() {
      let baseUri = context.flags.api_uri || 'https://api.fastly.com'
      let config = yield heroku.get(`/apps/${context.app}/config-vars`)
      let apiKey = context.flags.api_key || config.FASTLY_API_KEY

      if (!apiKey) {
        cli.error(
          'config var FASTLY_API_KEY not found! The Fastly add-on is required to configure TLS. Install Fastly at https://elements.heroku.com/addons/fastly'
        )
        process.exit(1)
      }

      const urlParams = `?domain=${context.args.domain}&service_id=${config.FASTLY_SERVICE_ID}`
      const url = `${baseUri}/plugin/heroku/tls/status${urlParams}`

      if (context.args.verification_action.toLowerCase() == 'start') {
        request.get({ url, headers: { 'Fastly-Key': apiKey } }, function(error, response, body) {
          if (!error && response.statusCode == 200) {
            let json = JSON.parse(body)
            cli.warn(`Valid approval domains: ${json.metadata.valid_approvals.toString()}`)

            cli
              .prompt('Type the approval domain to use (or ENTER if only 1): ')
              .then(function(approval) {
                let valid = json.metadata.valid_approvals.indexOf(approval)

                if (valid == -1) {
                  cli.error('Entered domain does not match a valid approval. Try again')
                  process.exit(1)
                }

                request(
                  {
                    method: 'POST',
                    url: `${baseUri}/plugin/heroku/tls/verify`,
                    headers: { 'Fastly-Key': apiKey },
                    form: {
                      approval,
                      domain: context.args.domain,
                      service_id: config.FASTLY_SERVICE_ID, // eslint-disable-line camelcase
                    },
                  },
                  function(err, response, body) {
                    if (!error && response.statusCode == 200) {
                      cli.warn(
                        "Domain queued for verification. This may take up to 30 minutes. To check the status, run 'heroku fastly:verify status DOMAIN --app APP'"
                      )
                    } else {
                      cli.error(body)
                    }
                  }
                )
              })
          } else {
            cli.error(body)
          }
        })
      }

      if (context.args.verification_action.toLowerCase() == 'status') {
        request.get({ url, headers: { 'Fastly-Key': apiKey } }, function(error, response, body) {
          if (!error && response.statusCode == 200) {
            let json = JSON.parse(body)
            cli.warn(`Status: ${json.state}`)
            if (json.state == 'issued') {
              cli.warn(
                'Your certificate has been issued. It could take up to an hour for the certificate to propagate globally.\n'
              )
              cli.warn('To use the certificate configure the following CNAME record: \n')
              const [{ cname }] = json.dns
              cli.warn(`CNAME  ${context.args.domain}  ${cname}`)
            } else {
              cli.warn('Your cert has not yet been issued. Please try again shortly.')
            }
          } else {
            cli.error(body)
          }
        })
      }
    })
  }),
}
