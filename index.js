const botBuilder = require('claudia-bot-builder')

module.exports = (event, context) => {
  console.log(JSON.stringify(event, null, 2))
  console.log(JSON.stringify(context, null, 2))

  return botBuilder((request, originalRequest) => {
    console.log(JSON.stringify(request, null, 2))
    console.log(JSON.stringify(originalRequest, null, 2))

    return `Hello from space explorer bot! Your request was: ${request.text}`
  }, { platforms: ['telegram'] })(event, context)
}
