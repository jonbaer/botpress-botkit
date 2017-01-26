const BotkitCore = require('botkit').core

module.exports = {
  init: function(bp) {
  },
  ready: function(bp) {
  },
  BotpressBot: BotpressBot
}

function BotpressBot(bp, configuration) {

  var botpressBot = BotkitCore(Object.assign({
    logger: bp.logger
  }, configuration))

  botpressBot.receive_as_text = configuration.receive_as_text || ['quick_reply']

  var handleIncoming = bot => (event, next) => {
    var message = {
      text: event.text,
      user: event.user ? event.user.id : 'user',
      channel: event.platform,
      timestamp: Date.now(),
      raw: event
    }

    if (event.type === 'message' || event.type === 'text') {
      botpressBot.receiveMessage(bot, message)
    } else {
      // not a text message, dispatch a custom event

      if (botpressBot.receive_as_text) {
        for (var i of botpressBot.receive_as_text) {
          if (i === event.type) {
            message.text = `${event.type}::${event.text}`
            return botpressBot.receiveMessage(bot, message)
          }
        }
      }

      botpressBot.trigger(event.type, [bot, event])
    }

    next()
  }

  var handleOutgoing = bot => (event, next) => {
    if (!event.__botkit_tracked) {
      const convo = bot.findConversationByUser(event.user || event.raw.to)
      if (convo) {
        convo.addMessage.call(convo, event, event.thread)
      }
    }

    next()
  }

  botpressBot.middleware.spawn.use((bot, next) => {
    bp.middlewares.register({
      name: 'botkit.incoming',
      type: 'incoming',
      order: 100,
      handler: handleIncoming(bot),
      module: 'botpress-botkit',
      description: 'Pipes incoming messages into Botkit, swallowing them'
    })

    bp.middlewares.register({
      name: 'botkit.outgoing',
      type: 'outgoing',
      order: 100,
      handler: handleOutgoing(bot),
      module: 'botpress-botkit',
      description: 'Keeps track of sent messages in conversations'
    })

    next()
  })

  botpressBot.defineBot(function(botkit, config) {

    var bot = {
      botkit: botkit,
      config: config || {},
      utterances: botkit.utterances,
    }

    bot.send = function(message, cb) {
      message.__botkit_tracked = true
      bp.middlewares.sendOutgoing(message)
      cb && cb()
    }

    bot.reply = function(src, resp, cb) {
      if (typeof(resp) === 'function') {
        const ret = resp()
        if (ret.then) {
          ret.then(() => cb && cb(), err => cb && cb(err))
        }
        return
      }

      if (typeof(resp) === 'string' || (typeof(resp.text) === 'string' && !resp.type && !resp.platform)) {
        var msg = {
          timestamp: Date.now(),
          user: src.user,
          raw: { to: src.user, message: resp.text || resp },
          platform: src.channel,
          channel: src.channel,
          type: 'text',
          text: resp.text || resp
        }

        return bot.say(msg, cb)
      }

      if (resp && !resp.channel) {
        resp.channel = resp.platform
      }

      if (resp && !resp.timestamp) {
        resp.timestamp = Date.now()
      }

      bot.say(resp, cb)
    }

    bot.startConversation = function(message, cb) {
      botkit.startConversation(this, message, cb)
    }

    bot.findConversationByUser = function(user) {
      for (var t = 0; t < botkit.tasks.length; t++) {
        for (var c = 0; c < botkit.tasks[t].convos.length; c++) {
          if (botkit.tasks[t].convos[c].isActive() && botkit.tasks[t].convos[c].source_message.user == user) {
            return botkit.tasks[t].convos[c]
          }
        }
      }
    }

    bot.findConversation = function(message, cb) {
      const convo = bot.findConversationByUser(message.user, cb)
      cb && cb(convo)
    }

    return bot
  })
  return botpressBot
}
