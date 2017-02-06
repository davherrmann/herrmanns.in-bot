const request = require('request')
const updateGist = require('./uploadMessage.js')
const triggerTravis = require('./triggerTravis.js')
const crypto = require('crypto')
const createMailgun = require('mailgun-js')

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

const createToken = () => crypto.randomBytes(16).toString('hex')

const addToMailingList = ({context, user: {address, name, token}}) => {
  const mailgun = createMailgun({
    apiKey: context.data.MAILGUN_TOKEN,
    domain: 'herrmanns.email'
  })

  const list = mailgun.lists('rundbrief@herrmanns.email')

  list.members().create({
    subscribed: true,
    address,
    name,
    vars: {
      token
    }
  })
}

module.exports = (context, req, res) => {
  redirectToSubscriptionDone(res)

  if (context.data.subscribe !== undefined) {
    const token = createToken()

    updateGist({
      gistId: context.data.SUBSCRIBERS_GIST_ID,
      token: context.data.GITHUB_TOKEN
    }, {
      fileName: `subscriber-${token}.json`,
      content: {
        name: context.data.name,
        email: context.data.email,
        token
      }
    })

    addToMailingList({
      context,
      user: {
        name: context.data.name,
        address: context.data.email,
        token
      }
    })

    return
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
