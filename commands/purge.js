'use strict';
module.exports = {
  topic: 'fastly',
  command: 'purge',
  description: 'Purge objects from fastly edge caches',
  help: 'Purge an object or the entire cache',
  flags: [
      { name: 'all', description: 'Issues a Fastly PurgeAll' }
  ],

  run: function (context) {
    if (context.flags.all) {
      // Fastly.purge_all();

      console.log('PurgeAll request issued');
    } else {
      // Fastly.purge_url();
      console.log('Purge request issued for url: ');
    }
  }
};
