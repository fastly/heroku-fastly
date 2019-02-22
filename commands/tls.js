'use strict'
const hk = require('heroku-cli-util')
const request = require('request')
const co = require('co')

module.exports = {
  topic: 'fastly',
  command: 'tls',
  description: 'Add/Remove Fastly TLS to DOMAIN',
  help:
    'DOMAIN will be added to a Fastly Heroku SAN SSL certificate. \n\n\
Requirements: \n\
 - The Fastly Service must have DOMAIN configured in the active version \n\
 - Heroku pricing plan must include TLS Domain(s) \n\
 - Wildcard domains are not allowed \n\n\
You must verify ownership of DOMAIN after running this command. \n\
Valid VERIFICATION_TYPES: dns\n\
  DNS: Create a DNS TXT record with the provided metatag via your DNS provider. \n\
Usage: \n\
  heroku fastly:tls www.example.org dns --app my-fast-app\n ',
  needsApp: true,
  needsAuth: true,
  args: [{ name: 'domain', description: 'The domain for TLS configure' }],
  flags: [
    { name: 'delete', char: 'd', description: 'Remove TLS from DOMAIN', hasValue: false },
    {
      name: 'api_key',
      char: 'k',
      description: 'Override FASTLY_API_KEY config var',
      hasValue: true,
    },
    { name: 'api_uri', char: 'u', description: 'Override Fastly API URI', hasValue: true },
  ],
  run: hk.command(function(context, heroku) {
    return co(function*() {
      let baseUri = context.flags.api_uri || 'https://api.fastly.com'
      let config = yield heroku.get(`/apps/${context.app}/config-vars`)
      let apiKey = context.flags.api_key || config.FASTLY_API_KEY

      if (!apiKey) {
        hk.error(
          'config var FASTLY_API_KEY not found! The Fastly add-on is required to configure TLS. Install Fastly at https://elements.heroku.com/addons/fastly'
        )
        process.exit(1)
      }

      if (context.flags.delete) {
        request(
          {
            method: 'DELETE',
            url: `${baseUri}/plugin/heroku/tls`,
            headers: { 'Fastly-Key': apiKey, 'Content-Type': 'application/json' },
            form: {
              domain: context.args.domain,
              service_id: config.FASTLY_SERVICE_ID, // eslint-disable-line camelcase
            },
          },
          function(err, response, body) {
            if (response.statusCode != 200) {
              hk.error(
                `Fastly API request Error! code: ${response.statusCode} ${response.statusMessage} ${
                  JSON.parse(body).msg
                }`
              )
              process.exit(1)
            } else {
              hk.styledHeader(
                `Domain ${
                  context.args.domain
                } queued for TLS removal. This domain will no longer support TLS`
              )
            }
          }
        )
      } else {
        const form = {
          domain: context.args.domain,
          verification_type: 'dns', // eslint-disable-line camelcase
          service_id: config.FASTLY_SERVICE_ID, // eslint-disable-line camelcase
        }
        request(
          {
            method: 'POST',
            url: `${baseUri}/plugin/heroku/tls`,
            headers: { 'Fastly-Key': apiKey, 'Content-Type': 'application/json' },
            form,
          },
          function(err, response, body) {
            if (response.statusCode != 200) {
              hk.error(
                `Fastly API request Error! code: ${response.statusCode} ${response.statusMessage} ${
                  JSON.parse(body).msg
                }`
              )
              process.exit(1)
            } else {
              const output = JSON.parse(body)
              if (Array.isArray(output.msg)) {
                output.msg.forEach(message => {
                  if (!message.success) {
                    if (Array.isArray(message.errors)) {
                      message.errors.forEach(error => hk.error(error))
                    }
                  }
                })
              }
              if (output.metatag) {
                hk.styledHeader(
                  `Domain ${
                    context.args.domain
                  } has been queued for TLS certificate addition. This may take a few minutes.`
                )
                hk.warn(
                  'In the mean time, start the domain verification process by creating a DNS TXT record containing the following content: \n'
                )
                hk.warn(output.metatag)
                hk.warn(
                  'Once you have added this TXT record you can start the verification process by running:\n'
                )
                hk.warn('$ heroku fastly:verify start DOMAIN —app APP')
              } else {
                hk.warn('Unable to process this request.')
              }
            }
          }
        )
      }
    })
  }),
}
