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

const statusOk = cb => cb(null, {status: 'ok'})

module.exports = (context, cb) => {
  if (context.data.trigger !== undefined) {
    triggerTravis({
      token: context.data.TRAVIS_TOKEN,
      repositoryOwner: context.data.REPOSITORY_OWNER,
      repository: context.data.REPOSITORY
    })

    return statusOk(cb)
  }

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

  return statusOk(cb)
}
