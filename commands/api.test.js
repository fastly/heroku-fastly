'use strict'

require('jest-fetch-mock').enableMocks()
const apiClient = require('./api')

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
})
