'use strict';
var hk = require('heroku-cli-util');
var request = require('request');

module.exports = {
  topic: 'fastly',
  command: 'log-create',
  description: 'Create a new fastly logging object',
  help: '',
  needsApp: true,
  needsAuth: true,
  args: [
    {name: 'name', description: 'Name for logging'},
    {name: 'token', description: '', optional: true},
  ],
  flags: [
      { name: 'all', description: 'Issues a Fastly PurgeAll', hasValue: false }
  ],

  run: hk.command(function* (context, heroku) {
    let config = yield heroku.apps(context.app).configVars().info();
    var fastly = require('fastly')(config.FASTLY_API_KEY);

    let base_uri = context.flags.api_uri || 'https://api.fastly.com';
    let api_key = context.flags.api_key || config.FASTLY_API_KEY

     // ensure you return this promise chain so errors will be properly displayed
    return heroku.get(`/apps/${context.app}/logplex`).then(app => {
      hk.debug(app)
    })

    request.get({
      url: base_uri + '/service/' + config.FASTLY_SERVICE_ID,
      headers: { 'Fastly-Key': api_key, 'Content-Type': 'application/json' },
    }, function(err, response, body) {
      var json = JSON.parse(body)
      var active_version;
      for(var i = 0; i < json.versions.length; i++) {
        if (json.versions[i].active == true) {
          active_version = json.versions[i].number;
        }
      }

      request({
        method: 'POST',
        url: base_uri + '/service/' + config.FASTLY_SERVICE_ID + '/version/' + active_version + 'logging/heroku',
        headers: { 'Fastly-Key': api_key, 'Content-Type': 'application/json' },
        form: {
          name: context.args.name,
          token: '',
          url: ''
        }
      }, function(err, response, body) {
          var json = JSON.parse(body);
          hk.warn(json)
      });
    });

  })
};
