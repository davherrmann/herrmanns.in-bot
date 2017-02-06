const request = require('request')
const updateGist = require('./uploadMessage.js')
const triggerTravis = require('./triggerTravis.js')

const baseUrl = token => `https://api.telegram.org/bot${token}/`

const sendMessage = ({token, chatId, message}) => {
  request.post(
    baseUrl(token) + 'sendMessage',
    {
      form: {
        'chat_id': chatId,
        'text': message
      }
    }
  )
}

const uploadMessage = ({message, options}) => {
  updateGist(options, {
    fileName: `message-${Date.now()}.json`,
    content: message
  })
}

const statusOk = res => {
  res.writeHead(200)
  res.end()
}

const redirectToSubscriptionDone = res => {
  res.writeHead(302, {
    'Location': 'https://herrmanns.in/birmingham/sagen/danke'
  })
  res.end()
}

module.exports = (context, req, res) => {
  if (context.data.subscribe !== undefined) {
    redirectToSubscriptionDone(res)
  }

  if (context.data.trigger !== undefined) {
    triggerTravis({
      token: context.data.TRAVIS_TOKEN,
      repositoryOwner: context.data.REPOSITORY_OWNER,
      repository: context.data.REPOSITORY
    })

    return statusOk(res)
  }

  if (context.data.message !== undefined) {
    uploadMessage({
      message: context.data.message,
      options: {
        gistId: context.data.GIST_ID,
        token: context.data.GITHUB_TOKEN
      }
    })
    triggerTravis({
      token: context.data.TRAVIS_TOKEN,
      repositoryOwner: context.data.REPOSITORY_OWNER,
      repository: context.data.REPOSITORY
    })
    return statusOk(res)
  }

  return statusOk(res)
}
