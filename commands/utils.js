const hk = require('heroku-cli-util')

function validateAPIKey(apiKey) {
  if (!apiKey) {
    hk.error(
      'config var FASTLY_API_KEY not found! The Fastly add-on is required to configure TLS. Install Fastly at https://elements.heroku.com/addons/fastly'
    )
    process.exit(1)
  }
}

function renderFastlyError() {
  return (err) => {
    hk.error(`Fastly Plugin execution error - ${err.name} - ${err.message}`)
    process.exit(1)
  }
}

function displayChallenge(challenges, type) {
  for (var i = 0; i < challenges.length; i++) {
    let challenge = challenges[i]
    if (challenge.type === type) {
      hk.log(`DNS Record Type: ${challenge.record_type}`)
      hk.log(`DNS Record Name: ${challenge.record_name}`)
      hk.log(`DNS Record value(s): ${challenge.values.join(', ')}\n`)
    }
  }
}

exports.displayChallenge = displayChallenge
exports.renderFastlyError = renderFastlyError
exports.validateAPIKey = validateAPIKey
