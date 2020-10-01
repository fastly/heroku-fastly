'use strict'

const utils = require('../commands/utils')
const hk = require('heroku-cli-util')
var mockProcess = require('jest-mock-process')

describe('interaction with utils functions', () => {
  const herokuErrorSpy = jest.spyOn(hk, 'error')
  const mockExit = mockProcess.mockProcessExit()
  const mockLog = mockProcess.mockConsoleLog()

  beforeEach(() => {
    mockLog.mockReset()
    herokuErrorSpy.mockReset()
    mockExit.mockReset()
  })

  const testChallenges = [
    {
      type: 'managed-dns',
      record_type: 'CNAME',
      record_name: '_acme-challenge.www.example.org',
      values: ['dvxzuc4govtr3juagj.fastly-validations.com'],
    },
    {
      type: 'managed-http-cname',
      record_type: 'CNAME',
      record_name: 'www.example.org',
      values: ['j.sni.global.fastly.net'],
    },
    {
      type: 'managed-http-a',
      record_type: 'A',
      record_name: 'www.example.org',
      values: [
        '151.101.2.132',
        '151.101.66.132',
        '151.101.130.132',
        '151.101.194.132',
      ],
    },
  ]

  it('confirm managed-dns challenge renders correctly', async () => {
    utils.displayChallenge(testChallenges, 'managed-dns')

    expect(mockLog).toHaveBeenCalledTimes(3)
    expect(mockLog).toHaveBeenCalledWith('DNS Record Type: CNAME')
    expect(mockLog).toHaveBeenCalledWith(
      'DNS Record Name: _acme-challenge.www.example.org'
    )
    expect(mockLog).toHaveBeenCalledWith(
      'DNS Record value(s): dvxzuc4govtr3juagj.fastly-validations.com\n'
    )
  })

  it('confirm managed-http-cname challenge renders correctly', async () => {
    utils.displayChallenge(testChallenges, 'managed-http-cname')

    expect(mockLog).toHaveBeenCalledTimes(3)
    expect(mockLog).toHaveBeenCalledWith('DNS Record Type: CNAME')
    expect(mockLog).toHaveBeenCalledWith('DNS Record Name: www.example.org')
    expect(mockLog).toHaveBeenCalledWith(
      'DNS Record value(s): j.sni.global.fastly.net\n'
    )
  })

  it('confirm managed-http-a challenge renders correctly', async () => {
    utils.displayChallenge(testChallenges, 'managed-http-a')

    expect(mockLog).toHaveBeenCalledTimes(3)
    expect(mockLog).toHaveBeenCalledWith('DNS Record Type: A')
    expect(mockLog).toHaveBeenCalledWith('DNS Record Name: www.example.org')
    expect(mockLog).toHaveBeenCalledWith(
      'DNS Record value(s): 151.101.2.132, 151.101.66.132, 151.101.130.132, 151.101.194.132\n'
    )
  })

  it('confirm managed-http-a challenge renders correctly with fewer ip addresses', async () => {
    const challenges = [
      {
        type: 'managed-http-a',
        record_type: 'A',
        record_name: 'www.example.org',
        values: ['151.101.2.132', '151.101.66.132'],
      },
    ]

    utils.displayChallenge(challenges, 'managed-http-a')

    expect(mockLog).toHaveBeenCalledTimes(3)
    expect(mockLog).toHaveBeenCalledWith('DNS Record Type: A')
    expect(mockLog).toHaveBeenCalledWith('DNS Record Name: www.example.org')
    expect(mockLog).toHaveBeenCalledWith(
      'DNS Record value(s): 151.101.2.132, 151.101.66.132\n'
    )
  })

  it('renders error message and exits when no API key is supplied', async () => {
    utils.validateAPIKey(null)

    expect(herokuErrorSpy).toHaveBeenCalledTimes(1)
    expect(herokuErrorSpy).toHaveBeenCalledWith(
      'config var FASTLY_API_KEY not found! The Fastly add-on is required to configure TLS. Install Fastly at https://elements.heroku.com/addons/fastly'
    )
    expect(mockExit).toBeCalledWith(1)
  })

  it('does not render error or exits when a API key is supplied', async () => {
    utils.validateAPIKey('XXXXXXXXX')

    expect(herokuErrorSpy).not.toBeCalled()
    expect(mockExit).not.toBeCalled()
  })

  it('renders error as expected', async () => {
    const errFunc = utils.renderFastlyError()

    errFunc({ name: 'test error', message: 'test error message' })

    expect(herokuErrorSpy).toBeCalledTimes(1)
    expect(herokuErrorSpy).toBeCalledWith(
      'Fastly Plugin execution error - test error - test error message'
    )
    expect(mockExit).toBeCalledTimes(1)
  })
})
