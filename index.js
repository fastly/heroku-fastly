'use strict';
exports.topic = {
  name: 'fastly',
  // this is the help text that shows up under `heroku help`
  description: 'fastly tools'
};

exports.commands = [
  require('./commands/purge.js')
];
