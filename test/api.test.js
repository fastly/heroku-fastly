'use strict'

require('jest-fetch-mock').enableMocks()
const apiClient = require('../commands/api')

describe('interaction with fastly api', () => {
  beforeEach(() => {
    fetch.resetMocks()
  })

  it('calls fastly create subscription with expected JSON body', async () => {
    fetch.mockResponses(JSON.stringify({ data: {} }), { status: 201 })

    let expectedTestDomain = 'www.mytestdomain.com'
    let expectedFastlyApiKey = 'XXXXXXXXX'

    let api = new apiClient({
      apiKey: `${expectedFastlyApiKey}`,
    })

    let json = await api.createSubscription(expectedTestDomain)

    expect(json).not.toBeNull()
    expect(fetch).toHaveBeenCalledTimes(1)
    expect(fetch).toHaveBeenCalledWith(
      'https://api.fastly.com/tls/subscriptions',
      {
        method: 'POST',
        headers: {
          Accept: 'application/vnd.api+json',
          'Content-Type': 'application/vnd.api+json',
          'Fastly-Key': `${expectedFastlyApiKey}`,
        },
        body: JSON.stringify({
          data: {
            type: 'tls_subscription',
            attributes: {
              certificate_authority: 'lets-encrypt',
            },
            relationships: {
              tls_domains: {
                data: [{ type: 'tls_domain', id: `${expectedTestDomain}` }],
              },
              tls_configuration: {
                data: {},
              },
            },
          },
        }),
      }
    )
  })

  it('calls fastly get domains with correct url and headers', async () => {
    fetch.mockResponses(JSON.stringify({ data: {} }), { status: 200 })

    let expectedFastlyApiKey = 'XXXXXXXXX'

    let api = new apiClient({
      apiKey: `${expectedFastlyApiKey}`,
    })

    let json = await api.getDomains()

    expect(json).not.toBeNull()
    expect(fetch).toHaveBeenCalledTimes(1)
    expect(fetch).toHaveBeenCalledWith(
      'https://api.fastly.com/tls/domains?include=tls_activations,tls_subscriptions.tls_authorizations,tls_subscriptions',
      {
        method: 'GET',
        headers: {
          Accept: 'application/vnd.api+json',
          'Content-Type': 'application/vnd.api+json',
          'Fastly-Key': `${expectedFastlyApiKey}`,
        },
      }
    )
  })

  it('calls fastly delete activation with correct url and headers', async () => {
    fetch.mockResponses(JSON.stringify({ data: {} }), { status: 204 })

    let expectedFastlyApiKey = 'XXXXXXXXX'
    let expectedFastlyActivationId = 'xnXOIZM4ebbmSA5dgk3xmw'

    let api = new apiClient({
      apiKey: `${expectedFastlyApiKey}`,
    })

    let json = await api.deleteActivation(expectedFastlyActivationId)

    expect(json).not.toBeNull()
    expect(fetch).toHaveBeenCalledTimes(1)
    expect(fetch).toHaveBeenCalledWith(
      `https://api.fastly.com/tls/activations/${expectedFastlyActivationId}`,
      {
        method: 'DELETE',
        headers: {
          Accept: 'application/vnd.api+json',
          'Content-Type': 'application/vnd.api+json',
          'Fastly-Key': `${expectedFastlyApiKey}`,
        },
      }
    )
  })

  it('calls fastly delete subscription with correct url and headers', async () => {
    fetch.mockResponses(JSON.stringify({ data: {} }), { status: 204 })

    let expectedFastlyApiKey = 'XXXXXXXXX'
    let expectedFastlySubscriptionId = 'DzZk7Txr2XJmDDqYSOSA0A'

    let api = new apiClient({
      apiKey: `${expectedFastlyApiKey}`,
    })

    let json = await api.deleteSubscription(expectedFastlySubscriptionId)

    expect(json).not.toBeNull()
    expect(fetch).toHaveBeenCalledTimes(1)
    expect(fetch).toHaveBeenCalledWith(
      `https://api.fastly.com/tls/subscriptions/${expectedFastlySubscriptionId}`,
      {
        method: 'DELETE',
        headers: {
          Accept: 'application/vnd.api+json',
          'Content-Type': 'application/vnd.api+json',
          'Fastly-Key': `${expectedFastlyApiKey}`,
        },
      }
    )
  })
})
