'use strict';
let expect = require('chai').expect;

describe('fastly', function () {
  it('has a clear command', function () {
    index.commands[0].command.should.equal('purge');
  });

});
