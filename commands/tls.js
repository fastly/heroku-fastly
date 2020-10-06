'use strict'
const hk = require('heroku-cli-util')
const co = require('co')
const apiClient = require('./api')
const utils = require('./utils')

const JsonApiDataStore = require('jsonapi-datastore').JsonApiDataStore

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
Usage: \n\
  heroku fastly:tls www.example.org --app my-fast-app\n ',
  needsApp: true,
  needsAuth: true,
  args: [{ name: 'domain', description: 'The domain for TLS configure' }],
  flags: [
    {
      name: 'delete',
      char: 'd',
      description: 'Remove TLS from DOMAIN',
      hasValue: false,
    },
    {
      name: 'api_uri',
      char: 'u',
      description: 'Override Fastly API URI',
      hasValue: true,
    },
    {
      name: 'api_key',
      char: 'k',
      description: 'Override FASTLY_API_KEY config var',
      hasValue: true,
    },
  ],

  run: hk.command(function (context, heroku) {
    return co(function* () {
      let baseUri = context.flags.api_uri || 'https://api.fastly.com'
      let config = yield heroku.get(`/apps/${context.app}/config-vars`)
      let apiKey = context.flags.api_key || config.FASTLY_API_KEY
      let domain = context.args.domain

      utils.validateAPIKey(apiKey)

      const api = new apiClient({
        baseUri: baseUri,
        apiKey: apiKey,
      })

      if (context.flags.delete) {
        api
          .getDomains()
          .then(locateSubscriptionDetails(domain))
          .then(deleteActivation(api, domain))
          .then(deleteSubscription(api, domain))
          .catch(utils.renderFastlyError())
      } else {
        api
          .getDomains()
          .then(locateSubscriptionDetails(domain))
          .then(createSubscription(api, domain))
          .catch(utils.renderFastlyError())
      }
    })
  }),
}

function createSubscription(api, domain) {
  return (data) => {
    if (!data.subscriptionId) {
      api
        .createSubscription(domain)
        .then((data) => {
          const store = new JsonApiDataStore()
          let subscription = store.sync(data)
          let state = subscription.state
          let challenges = subscription.tls_authorizations[0].challenges

          if (state === 'issued' || state === 'renewing') {
            hk.log(
              `The domain ${domain} is currently in a state of ${state}. It could take up to an hour for the certificate to propagate globally.\n`
            )

            hk.log(
              'To use the certificate configure the following CNAME record\n'
            )
            utils.displayChallenge(challenges, 'managed-http-cname')

            hk.log(
              'As an alternative to using a CNAME record the following A record can be configured\n'
            )
            utils.displayChallenge(challenges, 'managed-http-a')
          }

          if (state === 'pending' || state === 'processing') {
            hk.log(
              `The domain ${domain} is currently in a state of ${state} and the issuing of a certificate may take up to 30 minutes\n`
            )

            hk.log(
              'To start the domain verification process create a DNS CNAME record with the following values\n'
            )
            utils.displayChallenge(challenges, 'managed-dns')

            hk.log(
              'Alongside the initial verification record configure the following CNAME record\n'
            )
            utils.displayChallenge(challenges, 'managed-http-cname')

            hk.log(
              'As an alternative to using a CNAME record the following A record can be configured\n'
            )
            utils.displayChallenge(challenges, 'managed-http-a')
          }
        })
        .catch((e) => {
          hk.error(`Fastly Plugin execution - ${e.name} - ${e.message}`)
          process.exit(1)
        })
    } else {
      hk.error(`The domain ${domain} already has a TLS subscription`)
    }
  }
}

function deleteActivation(api, domain) {
  return (data) => {
    if (data.activationId) {
      api
        .deleteActivation(data.activationId)
        .then(() => {
          hk.log(`TLS subscription for domain ${domain} has been deactivated`)
        })
        .catch((e) => {
          hk.error(`Fastly Plugin execution - ${e.name} - ${e.message}`)
          process.exit(1)
        })
    } else {
      hk.log(`TLS subscription for domain ${domain} was not active`)
    }
    return data
  }
}

function deleteSubscription(api, domain) {
  return (data) => {
    if (data.subscriptionId) {
      api
        .deleteSubscription(data.subscriptionId)
        .then(() => {
          hk.log(`TLS subscription for domain ${domain} has been removed`)
          hk.log('This domain will no longer support TLS')
        })
        .catch((e) => {
          hk.error(`Fastly Plugin execution - ${e.name} - ${e.message}`)
          process.exit(1)
        })
    } else {
      hk.error(`The domain ${domain} does not support TLS`)
    }
  }
}

function locateSubscriptionDetails(domain) {
  return (data) => {
    const store = new JsonApiDataStore()
    store.sync(data)
    const tlsDomain = store.find('tls_domain', domain)

    const subDetails = {
      activationId: null,
      subscriptionId: null,
    }

    if (tlsDomain) {
      let activations = tlsDomain.tls_activations
      let subscriptions = tlsDomain.tls_subscriptions

      if (activations.length > 0) {
        subDetails.activationId = activations[0].id
      }

      if (subscriptions.length > 0) {
        subDetails.subscriptionId = subscriptions[0].id
      }
    }

    return subDetails
  }
}
