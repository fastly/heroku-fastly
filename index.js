'use strict';
exports.topic = {
  name: 'fastly',
  description: 'Fastly CDN CLI tools for Heroku'
};

exports.commands = [
  require('./commands/purge'),
  require('./commands/tls'),
  require('./commands/verify'),
];
