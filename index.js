'use strict';
exports.topic = {
  name: 'fastly',
  description: 'Fastly CDN CLI tools for Heroku'
};

exports.commands = [
  require('./commands/purge'),
  require('./commands/tls'),
  require('./commands/log-list'),
  require('./commands/log-create'),
  require('./commands/log-delete'),
  require('./commands/log-detail')
];
