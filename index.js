const request = require('request')
const {getGist, updateGist} = require('./uploadMessage.js')
const triggerTravis = require('./triggerTravis.js')
const crypto = require('crypto')
const createMailgun = require('mailgun-js')

const baseUrl = token => `https://api.telegram.org/bot${token}/`

const removeButton = ({token, chatId, messageId, message}) => {
  request.post(
    baseUrl(token) + 'editMessageText',
    {
      form: {
        'chat_id': chatId,
        'message_id': messageId,
        'text': message,
        'parse_mode': 'markdown',
        'reply_markup': '{}'
      }
    }
  )
}

const sendMessage = ({token, chatId, message, data}) => {
  request.post(
    baseUrl(token) + 'sendMessage',
    {
      form: {
        'chat_id': chatId,
        'text': message,
        'parse_mode': 'markdown',
        'reply_markup': JSON.stringify({
          'inline_keyboard': [[{
            text: 'Bestätigen',
            callback_data: data
          }]]
        })
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
    upsert: 'no',
    subscribed: true,
    address,
    name,
    vars: {
      token
    }
  })

  console.log(`added ${address} to mailing list`)
}

const registerTelegram = ({token, url}) => {
  request.post(
    baseUrl(token) + 'sendMessage',
    {
      form: {
        'url': url
      }
    }
  )
}

module.exports = (context, req, res) => {
  console.log(JSON.stringify(context.data, null, 2))

  if (context.data.callback_query !== undefined) {
    const action = context.data.callback_query.data

    if (action.startsWith('subscribe:')) {
      const token = action.replace('subscribe:', '')

      getGist({
        gistId: context.data.SUBSCRIBERS_GIST_ID,
        token: context.data.GITHUB_TOKEN
      })
      .then(res => res.json())
      .then(res => res.files[`subscriber-${token}.json`].content)
      .then(content => JSON.parse(content))
      .then(content => {
        addToMailingList({
          context,
          user: {
            address: content.email,
            name: content.name,
            token: content.token
          }
        })
        removeButton({
          token: context.data.TELEGRAM_TOKEN,
          chatId: context.data.TELEGRAM_CHAT_ID,
          messageId: '' + context.data.callback_query.message.message_id,
          message: `*${content.name}* erhält Neuigkeiten von Euch an ${content.email}.`
        })
      })
    }
  }

  if (context.data.registerTelegram !== undefined) {
    registerTelegram({
      token: context.data.TELEGRAM_TOKEN,
      url: 'https://' + context.headers.host
    })

    return statusOk(res)
  }

  if (context.data.subscribe !== undefined) {
    redirectToSubscriptionDone(res)

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

    sendMessage({
      token: context.data.TELEGRAM_TOKEN,
      chatId: context.data.TELEGRAM_CHAT_ID,
      message: `*${context.data.name}* möchte an ${context.data.email} Neuigkeiten von Euch erhalten.`,
      data: 'subscribe:' + token
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
