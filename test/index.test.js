'use strict'

const index = require('../index')

describe('fastly heroku cli', () => {
  it('has a purge command', async () => {
    expect(index.commands[0].command).toEqual('purge')
  })

  it('has a tls command', async () => {
    expect(index.commands[1].command).toEqual('tls')
  })

  it('has a verify command', async () => {
    expect(index.commands[2].command).toEqual('verify')
  })
})
