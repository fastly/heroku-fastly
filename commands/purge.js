'use strict';
var hk = require('heroku-cli-util');

module.exports = {
  topic: 'fastly',
  command: 'purge',
  description: 'purge object from the cache with provided surrogate key or url',
  help: 'purge object from the cache with given surrogate key or url',
  args: [ { name: 'key'} ],
  flags: [
      { name: 'all', description: 'Issues a Fastly PurgeAll' }
  ],

  run: function (context) {
      // Fastly.purge_url();
      hk.styledHeader('Not yet implemented');
  }
};
