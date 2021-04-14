'use strict'
const hk = require('heroku-cli-util')
const co = require('co')
const fastly = require('fastly')

module.exports = {
  topic: 'fastly',
  command: 'purge',
  description:
    'Purge the entire Fastly cache or any object(s) with the provided surrogate key',
  help:
    'Purge object(s) from the Fastly cache with the provided surrogate key\n\
    More details on purge at docs.fastly.com/api/purge',
  needsApp: true,
  needsAuth: true,
  args: [{ name: 'key', optional: true }],
  flags: [
    { name: 'all', description: 'Issues a Fastly PurgeAll', hasValue: false },
    {
      name: 'soft',
      description: 'Forces revalidation instead of instant purge',
      hasValue: false,
    },
  ],

  run: hk.command(function (context, heroku) {
    if (!context.flags.all && !context.args.key) {
      return hk.error('You must specify `--all` or a key to purge with.')
    }

    return co(function* () {
      let config = yield heroku.get(`/apps/${context.app}/config-vars`)
      const api = fastly(config.FASTLY_API_KEY)

      if (context.flags.all) {
        api.purgeAll(config.FASTLY_SERVICE_ID, function (err, obj) {
          if (err) {
            hk.error(err)
          } else {
            hk.log(obj)
          }
        })
      }

      if (context.args.key) {
        if (context.flags.soft) {
          api.softPurgeKey(
            config.FASTLY_SERVICE_ID,
            context.args.key,
            function (err, obj) {
              if (err) {
                hk.error(err)
              } else {
                hk.log(obj)
              }
            }
          )
        } else {
          api.purgeKey(config.FASTLY_SERVICE_ID, context.args.key, function (
            err,
            obj
          ) {
            if (err) {
              hk.error(err)
            } else {
              hk.log(obj)
            }
          })
        }
      }
    })
  }),
}
