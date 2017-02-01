const botBuilder = require('claudia-bot-builder')

module.exports = botBuilder((request, originalRequest) => {
  console.log(JSON.stringify(request, null, 2))
  console.log(JSON.stringify(originalRequest, null, 2))

  return `Hello from space explorer bot! Your request was: ${request.text}`
}, { platforms: ['telegram'] })
