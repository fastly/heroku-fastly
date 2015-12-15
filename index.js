'use strict';
exports.topic = {
  name: 'fastly',
  description: 'Tools for interacting with Fastly CDN'
};

exports.commands = [
  require('./commands/purge')
];
