'use strict';
require('chai').should();
var index = require('../index');

describe('fastly', function () {
  it('has a purge command', function () {
    index.commands[0].command.should.equal('purge');
  });

  it('has a tls command', function () {
    index.commands[1].command.should.equal('tls');
  });

});
